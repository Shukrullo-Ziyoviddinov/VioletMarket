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
  busy?: boolean;
  permissionTitle: string;
  permissionMessage: string;
  allowLabel: string;
  backLabel: string;
  resultTitle: string;
  retakeLabel: string;
  useLabel: string;
  onClose: () => void;
  onCapture: (photoUri: string) => Promise<void> | void;
};

export function CargoCameraCapture({
  visible,
  busy = false,
  permissionTitle,
  permissionMessage,
  allowLabel,
  backLabel,
  resultTitle,
  retakeLabel,
  useLabel,
  onClose,
  onCapture,
}: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPreviewUri(null);
      setFacing('back');
      setIsCapturing(false);
    }
  }, [visible]);

  function resetAndClose() {
    if (busy) return;
    setPreviewUri(null);
    setFacing('back');
    onClose();
  }

  function flipCamera() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  async function takePhoto() {
    if (!cameraRef.current || isCapturing || busy) return;
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

  async function handleUse() {
    if (!previewUri || busy) return;
    await onCapture(previewUri);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={resetAndClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.permissionTitle}>{permissionTitle}</Text>
            <Text style={styles.permissionText}>{permissionMessage}</Text>
            <Pressable style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>{allowLabel}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={resetAndClose}>
              <Text style={styles.secondaryButtonText}>{backLabel}</Text>
            </Pressable>
          </View>
        ) : previewUri ? (
          <View style={styles.previewWrap}>
            <View style={styles.topBar}>
              <Pressable
                disabled={busy}
                style={styles.iconButton}
                onPress={resetAndClose}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.topTitle}>{resultTitle}</Text>
              <View style={styles.iconButtonSpacer} />
            </View>

            <Image source={{ uri: previewUri }} style={styles.previewImage} />

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
            >
              <Pressable
                disabled={busy}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && !busy && styles.pressed,
                ]}
                onPress={() => setPreviewUri(null)}
              >
                <Text style={styles.secondaryActionText}>{retakeLabel}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed && !busy && styles.pressed,
                ]}
                onPress={() => {
                  void handleUse();
                }}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionText}>{useLabel}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <View style={styles.topBar}>
              <Pressable style={styles.iconButton} onPress={resetAndClose}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.topTitle}>Kamera</Text>
              <Pressable style={styles.iconButton} onPress={flipCamera}>
                <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
            >
              <Pressable
                disabled={isCapturing}
                style={({ pressed }) => [
                  styles.shutter,
                  pressed && !isCapturing && styles.pressed,
                ]}
                onPress={() => {
                  void takePhoto();
                }}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>
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
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    minHeight: 48,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 15,
  },
  cameraWrap: {
    flex: 1,
  },
  previewWrap: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iconButtonSpacer: {
    width: 42,
    height: 42,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#E5E7EB',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  primaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.88,
  },
});
