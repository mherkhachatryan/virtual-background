export type SourceConfig = {
  type: 'image' | 'video' | 'camera'
  url?: string
}

export type SourcePlayback = {
  htmlElement: HTMLImageElement | HTMLVideoElement
  width: number
  height: number
}

export const sourceImageUrls = [
].map((imageName) => `${process.env.PUBLIC_URL}/images/${imageName}.jpg`)

export const sourceVideoUrls = [
  'david_original_final',
    'Dance - 32938'
].map((videoName) => `${process.env.PUBLIC_URL}/videos/${videoName}.mp4`)
