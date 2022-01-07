export type BackgroundConfig = {
  type: 'none' | 'blur' | 'image'
  url?: string
}

export const backgroundImageUrls = [
    'green screen'
].map((imageName) => `${process.env.PUBLIC_URL}/backgrounds/${imageName}.jpg`)
