import { supabase } from './supabase';

type UploadProfileAvatarParams = {
  userId: string;
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function getFileExtension(mimeType?: string | null, fileName?: string | null) {
  if (mimeType?.includes('png')) {
    return 'png';
  }

  if (mimeType?.includes('webp')) {
    return 'webp';
  }

  const fileNameExtension = fileName?.split('.').pop();

  if (fileNameExtension) {
    return fileNameExtension.toLowerCase();
  }

  return 'jpg';
}

function getContentType(mimeType?: string | null) {
  return mimeType || 'image/jpeg';
}

export async function uploadProfileAvatar({
  userId,
  uri,
  mimeType,
  fileName,
}: UploadProfileAvatarParams) {
  const extension = getFileExtension(mimeType, fileName);
  const contentType = getContentType(mimeType);
  const filePath = `${userId}/avatar-${Date.now()}.${extension}`;
  const response = await fetch(uri);
  const fileData = await response.arrayBuffer();

  const uploadResult = await supabase.storage.from('avatars').upload(filePath, fileData, {
    contentType,
    upsert: true,
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message || 'Unable to upload your profile photo.');
  }

  const publicUrlResult = supabase.storage.from('avatars').getPublicUrl(filePath);

  return publicUrlResult.data.publicUrl;
}
