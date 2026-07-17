import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  onCapture: (uri: string) => void;
  onClose: () => void;
};

export function CameraPhotoCapture({ onCapture, onClose }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  async function takePhoto() {
    if (!cameraRef.current || isTakingPhoto) return;
    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        skipProcessing: false,
      });
      if (photo?.uri) onCapture(photo.uri);
    } finally {
      setIsTakingPhoto(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator color="#6D28D9" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={58} color="#6D28D9" />
        <Text style={styles.permissionTitle}>Kamera ruxsati kerak</Text>
        <Text style={styles.permissionText}>
          Delivery profiliga real surat olish uchun kameraga ruxsat bering.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Ruxsat berish</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text style={styles.cancelText}>Bekor qilish</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" color="#FFFFFF" size={28} />
        </Pressable>
        <View style={styles.faceGuide} />
        <Text style={styles.hint}>Yuzingizni aylana ichiga joylashtiring</Text>
        <Pressable
          disabled={isTakingPhoto}
          style={styles.captureButton}
          onPress={takePhoto}>
          <View style={styles.captureButtonInner}>
            {isTakingPhoto && <ActivityIndicator color="#6D28D9" />}
          </View>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: '#111827',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 34,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginLeft: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  faceGuide: {
    width: 260,
    height: 330,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: '#000000',
    textShadowRadius: 6,
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 5,
    backgroundColor: '#FFFFFF',
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6D28D9',
    backgroundColor: '#FFFFFF',
  },
  permissionScreen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  permissionText: {
    marginTop: 10,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  permissionButton: {
    minWidth: 190,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#6D28D9',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    marginTop: 20,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});
