import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet} from 'react-native';
import {
  ViroARScene,
  ViroARImageMarker,
  ViroARTrackingTargets,
  Viro3DObject,
  ViroText,
  ViroNode,
  ViroAmbientLight,
  ViroSpotLight,
  ViroAnimations,
} from '@reactvision/react-viro';
import {MEDICINES} from '../constants/medicines';
import {Strings} from '../constants/strings';
import {getNextDoseInfo} from '../utils/timeUtils';
import {formatTime24to12} from '../utils/timeUtils';
import {speak} from '../services/ttsService';

// İlaç görselleri - AR hedef olarak
const targetImages: Record<string, any> = {
  neoral: require('../assets/ilac/ilaç 1.png'),
  deltacortril: require('../assets/ilac/ilaç 2.png'),
};

// 3D modeller
const models: Record<string, any> = {
  neoral: require('../assets/3D Model/ilaç 1.glb'),
  deltacortril: require('../assets/3D Model/ilaç 2.glb'),
};

// AR hedef görüntüleri kaydet
ViroARTrackingTargets.createTargets({
  neoralTarget: {
    source: targetImages.neoral,
    orientation: 'Up',
    physicalWidth: 0.12, // ~12cm kutu genişliği
  },
  deltacortrilTarget: {
    source: targetImages.deltacortril,
    orientation: 'Up',
    physicalWidth: 0.08, // ~8cm kutu genişliği
  },
});

// Animasyonlar
ViroAnimations.registerAnimations({
  scaleUp: {
    properties: {scaleX: 1, scaleY: 1, scaleZ: 1},
    duration: 500,
    easing: 'EaseInEaseOut',
  },
  rotate: {
    properties: {rotateY: '+=360'},
    duration: 4000,
  },
  floatUp: {
    properties: {positionY: 0.15},
    duration: 1000,
    easing: 'EaseInEaseOut',
  },
  appear: [['scaleUp', 'floatUp']] as any,
});

interface Props {
  times: Record<string, string[]>;
  onMedicineDetected?: (medicineId: string) => void;
}

export function ARMedicineScene({times, onMedicineDetected}: Props) {
  const [detectedMedicine, setDetectedMedicine] = useState<string | null>(null);
  const spokenRef = useRef<Set<string>>(new Set());

  const handleAnchorFound = (medicineId: string) => {
    setDetectedMedicine(medicineId);
    onMedicineDetected?.(medicineId);

    // Aynı ilaç için tekrar konuşma
    if (!spokenRef.current.has(medicineId)) {
      spokenRef.current.add(medicineId);

      const medicine = MEDICINES.find(m => m.id === medicineId);
      if (medicine) {
        const medicineTimes = times[medicineId] || medicine.defaultTimes;
        const countdown = getNextDoseInfo(medicineTimes);

        if (countdown.isOverdue) {
          speak(Strings.tts.overdueSpeech(medicine.name));
        } else {
          const nextTimeFormatted = formatTime24to12(countdown.nextTime);
          speak(
            Strings.tts.medicineSpeech(
              medicine.name,
              nextTimeFormatted,
              countdown.hours,
              countdown.minutes,
            ),
          );
        }
      }
    }

    // 10 saniye sonra tekrar konuşabilsin
    setTimeout(() => {
      spokenRef.current.delete(medicineId);
    }, 10000);
  };

  const handleAnchorRemoved = () => {
    setDetectedMedicine(null);
  };

  const renderMedicineAR = (medicineId: string, targetName: string) => {
    const medicine = MEDICINES.find(m => m.id === medicineId);
    if (!medicine) {return null;}

    const medicineTimes = times[medicineId] || medicine.defaultTimes;
    const countdown = getNextDoseInfo(medicineTimes);
    const nextTimeFormatted = formatTime24to12(countdown.nextTime);

    const infoText = countdown.isOverdue
      ? `${medicine.name}\nZAMANI GEÇTİ!`
      : `${medicine.name}\n${Strings.ar.nextDoseAt}: ${nextTimeFormatted}\n${countdown.hours}sa ${countdown.minutes}dk ${Strings.ar.timeRemaining}`;

    return (
      <ViroARImageMarker
        target={targetName}
        onAnchorFound={() => handleAnchorFound(medicineId)}
        onAnchorRemoved={handleAnchorRemoved}>
        {/* 3D Model */}
        <ViroNode position={[0, 0.05, 0]} scale={[0, 0, 0]} animation={{name: 'appear', run: true}}>
          <Viro3DObject
            source={models[medicineId]}
            type="GLB"
            position={[0, 0.05, 0]}
            scale={[0.05, 0.05, 0.05]}
            animation={{name: 'rotate', run: true, loop: true}}
          />
        </ViroNode>

        {/* Bilgi Metni */}
        <ViroNode position={[0, 0.25, 0]}>
          <ViroText
            text={infoText}
            scale={[0.3, 0.3, 0.3]}
            style={textStyles.infoText}
            outerStroke={{type: 'Outline', width: 2, color: '#000000'}}
            textLineBreakMode="WordWrap"
            width={2}
          />
        </ViroNode>
      </ViroARImageMarker>
    );
  };

  return (
    <ViroARScene>
      <ViroAmbientLight color="#FFFFFF" intensity={200} />
      <ViroSpotLight
        position={[0, 5, 0]}
        direction={[0, -1, 0]}
        color="#FFFFFF"
        intensity={500}
        attenuationStartDistance={5}
        attenuationEndDistance={10}
        castsShadow={true}
      />

      {renderMedicineAR('neoral', 'neoralTarget')}
      {renderMedicineAR('deltacortril', 'deltacortrilTarget')}
    </ViroARScene>
  );
}

const textStyles = StyleSheet.create({
  infoText: {
    fontFamily: 'Arial',
    fontSize: 15,
    color: '#FFFFFF',
    textAlignVertical: 'center',
  },
});
