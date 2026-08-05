export type User = {
  id: string
  name: string
}

export type Images = {
  main: Cover[]
}

export type TagRef = {
  id: string
  name: string
}
 
export type Cover = {
  type: 'original' | 'medium' | 'thumbnail'
  width: number
  height: number
  fileSize: number
  url: string
}