import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function ensureFileUri(uri: string): string {
  if (uri.startsWith('file://')) {
    return uri;
  }
  return uri.startsWith('/') ? `file://${uri}` : `file:///${uri}`;
}

/**
 * Copia o PDF para o cache do expo-file-system, onde o expo-sharing
 * tem permissão garantida de leitura no Android.
 */
export async function prepareShareablePdfUri(
  sourceUri: string,
  filename: string
): Promise<string> {
  const safeName = sanitizeFilename(filename);
  const destUri = `${FileSystem.cacheDirectory}share-${Date.now()}-${safeName}`;

  await FileSystem.deleteAsync(destUri, { idempotent: true });

  const normalizedSource = ensureFileUri(sourceUri);

  try {
    await FileSystem.copyAsync({ from: normalizedSource, to: destUri });
  } catch {
    const base64 = await FileSystem.readAsStringAsync(normalizedSource, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await FileSystem.writeAsStringAsync(destUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const info = await FileSystem.getInfoAsync(destUri);
  if (!info.exists) {
    throw new Error('Não foi possível preparar o PDF para compartilhamento.');
  }

  return destUri;
}

export async function shareTextFile(
  filename: string,
  content: string,
  mimeType = 'text/csv'
): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${sanitizeFilename(filename)}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
  }
}

export async function sharePdfFromUri(uri: string, filename: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  const shareableUri = await prepareShareablePdfUri(uri, filename);

  await Sharing.shareAsync(shareableUri, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
    ...(Platform.OS === 'ios' ? { UTI: 'com.adobe.pdf' } : {}),
  });
}
