import { GraphQLUpload } from "graphql-upload";
import cloudinary from "../../utils/cloudinary.js";

export const cloudinaryResolvers = {
  Upload: GraphQLUpload,

  Mutation: {
    uploadSingleImage: async (_: any, { file }: any) => {
      const { createReadStream } = await file;

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "uploads" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        createReadStream().pipe(stream);
      });

      return {
        id: (uploadResult as any).public_id,
        url: (uploadResult as any).secure_url,
      };
    },

    uploadMultipleImages: async (_: any, { files }: any) => {
      const uploads = await Promise.all(
        files.map(async (file: any) => {
          const { createReadStream } = await file;

          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "uploads" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            createReadStream().pipe(stream);
          });

          return {
            id: (uploadResult as any).public_id,
            url: (uploadResult as any).secure_url,
          };
        })
      );

      return uploads;
    },

    deleteSingleImage: async (_: any, { publicId }: { publicId: string }) => {
      const result = await cloudinary.uploader.destroy(publicId);
      return { result: result.result };
    },

    deleteMultipleImages: async (
      _: any,
      { publicIds }: { publicIds: string[] }
    ) => {
      const results = await Promise.all(
        publicIds.map(async (id) => {
          const result = await cloudinary.uploader.destroy(id);
          return { result: result.result };
        })
      );
      return results;
    },
  },
};
