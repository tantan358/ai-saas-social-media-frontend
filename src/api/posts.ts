import client from './client'

export interface PostUpdate {
  title?: string
  content?: string
}

export const postsApi = {
  updatePost: async (postId: string, data: PostUpdate): Promise<unknown> => {
    const response = await client.put(`/posts/${postId}`, data)
    return response.data
  },
}
