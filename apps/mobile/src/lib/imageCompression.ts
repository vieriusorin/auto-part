import * as ImageManipulator from 'expo-image-manipulator'

export const compressImageForUpload = async (uri: string) => {
  return ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1200 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  })
}
