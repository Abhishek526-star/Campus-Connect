import { api } from './api.js';

/** Generic single-file upload (spec §24) — used by event images, posts, etc. */
export const uploadApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadFile: build.mutation({
      query: ({ file, use }) => {
        const formData = new FormData();
        formData.append('file', file);
        return { url: `/upload?use=${use}`, method: 'POST', body: formData };
      },
    }),
  }),
});

export const { useUploadFileMutation } = uploadApi;
