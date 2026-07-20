import { Ionicons } from '@expo/vector-icons';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  uploading?: boolean;
  onClose: () => void;
  onUpload: (photoUri: string) => Promise<void> | void;
};

export function ProfileCameraCapture({
  visible,
  uploading = false,
  onClose,
  onUpload,
}: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPreviewUri(null);
      setFacing('front');
      setIsCapturing(false);
    }
  }, [visible]);

  function resetAndClose() {
    if (uploading) return;
    setPreviewUri(null);
    setFacing('front');
    onClose();
  }

  function flipCamera() {
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  }

  async function takePhoto() {
    if (!cameraRef.current || isCapturing || uploading) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) setPreviewUri(photo.uri);
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleUpload() {
    if (!previewUri || uploading) return;
    await onUpload(previewUri);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={resetAndClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.permissionTitle}>Kamera ruxsati kerak</Text>
            <Text style={styles.permissionText}>
              Profil rasmini olish uchun kamera ruxsatini yoqing.
            </Text>
            <Pressable style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>Ruxsat berish</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={resetAndClose}>
              <Text style={styles.secondaryButtonText}>Orqaga</Text>
            </Pressable>
          </View>
        ) : previewUri ? (
          <View style={styles.previewWrap}>
            <View style={styles.topBar}>
              <Pressable
                disabled={uploading}
                style={styles.iconButton}
                onPress={resetAndClose}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.topTitle}>Natija</Text>
              <View style={styles.iconButtonSpacer} />
            </View>

            <Image source={{ uri: previewUri }} style={styles.previewImage} />

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}>
              <Pressable
                disabled={uploading}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                  uploading && styles.disabled,
                ]}
                onPress={() => setPreviewUri(null)}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.secondaryActionText}>Qayta olish</Text>
              </Pressable>

              <Pressable
                disabled={uploading}
                style={({ pressed }) => [
                  styles.uploadButton,
                  pressed && styles.pressed,
                  uploading && styles.disabled,
                ]}
                onPress={handleUpload}>
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>Yuklash</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mirror={facing === 'front'}
            />

            <View style={[styles.topBar, styles.overlayTop]}>
              <Pressable style={styles.iconButton} onPress={resetAndClose}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.topTitle}>Profil rasmi</Text>
              <Pressable style={styles.iconButton} onPress={flipCamera}>
                <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <View
              style={[
                styles.captureBar,
                { paddingBottom: Math.max(insets.bottom, 28) },
              ]}>
              <Pressable
                disabled={isCapturing}
                style={({ pressed }) => [
                  styles.captureButton,
                  pressed && styles.pressed,
                  isCapturing && styles.disabled,
                ]}
                onPress={takePhoto}>
                <View style={styles.captureInner} />
              </Pressable>
              <Text style={styles.captureHint}>Suratga olish</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    color: '#D1D5DB',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 8,
    minWidth: 180,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#6d32c5',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minWidth: 180,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  cameraWrap: {
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iconButtonSpacer: {
    width: 44,
    height: 44,
  },
  captureBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 12,
    paddingTop: 18,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  captureHint: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
  },
  previewWrap: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    backgroundColor: '#111827',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#0B0B0F',
  },
  secondaryAction: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#374151',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  uploadButton: {
    flex: 1.2,
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6d32c5',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.65,
  },
});
