import {
  inputResolutions,
  SegmentationConfig,
} from '../../core/helpers/segmentationHelper'
import { TFLite } from '../../core/hooks/useTFLite'
import {
  compileShader,
  createPiplelineStageProgram,
  createTexture,
  glsl,
} from '../helpers/webglHelper'

export function buildResizingStage(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  positionBuffer: WebGLBuffer,
  texCoordBuffer: WebGLBuffer,
  segmentationConfig: SegmentationConfig,
  tflite: TFLite
) {
  const fragmentShaderSource = glsl`#version 300 es

    precision highp float;

    uniform sampler2D u_inputFrame;

    in vec2 v_texCoord;

    out vec4 outColor;

    void main() {
      outColor = texture(u_inputFrame, v_texCoord);
    }
  `

  // TFLite memory will be accessed as float32
  const tfliteInputMemoryOffset = tflite._getInputMemoryOffset() / 4

  const [outputWidth, outputHeight] = inputResolutions[
    segmentationConfig.inputResolution
  ]
  const outputPixelCount = outputWidth * outputHeight

  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  )
  const program = createPiplelineStageProgram(
    gl,
    vertexShader,
    fragmentShader,
    positionBuffer,
    texCoordBuffer
  )
  const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame')
  const outputTexture = createTexture(gl, gl.RGBA32F, outputWidth, outputHeight)

  const frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    outputTexture,
    0
  )
  const outputPixels = new Float32Array(outputPixelCount * 4)

  function render() {
    gl.useProgram(program)
    gl.uniform1i(inputFrameLocation, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.viewport(0, 0, outputWidth, outputHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.readPixels(
      0,
      0,
      outputWidth,
      outputHeight,
      gl.RGBA,
      gl.FLOAT,
      outputPixels
    )
    for (let i = 0; i < outputPixelCount; i++) {
      const tfliteIndex = tfliteInputMemoryOffset + i * 3
      const outputIndex = i * 4
      tflite.HEAPF32[tfliteIndex] = outputPixels[outputIndex]
      tflite.HEAPF32[tfliteIndex + 1] = outputPixels[outputIndex + 1]
      tflite.HEAPF32[tfliteIndex + 2] = outputPixels[outputIndex + 2]
    }
  }

  function cleanUp() {
    gl.deleteFramebuffer(frameBuffer)
    gl.deleteTexture(outputTexture)
    gl.deleteProgram(program)
    gl.deleteShader(fragmentShader)
  }

  return { render, cleanUp }
}