import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../constants/colors';
import {Strings} from '../constants/strings';
import {Medicine} from '../types';
import {useCountdown} from '../hooks/useCountdown';
import {CountdownTimer} from './CountdownTimer';
import {formatTime24to12} from '../utils/timeUtils';

// İlaç görselleri
const medicineImages: Record<string, any> = {
  neoral: require('../assets/ilac/ilaç 1.png'),
  deltacortril: require('../assets/ilac/ilaç 2.png'),
};

interface Props {
  medicine: Medicine;
  times: string[];
  onUpdateTimes: (times: string[]) => void;
}

export function MedicineCard({medicine, times, onUpdateTimes}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const countdown = useCountdown(times);

  const cardBg =
    medicine.id === 'neoral' ? Colors.cardNeoral : Colors.cardDeltacortril;

  const openEdit = () => {
    setEditTimes([...times]);
    setModalVisible(true);
  };

  const saveEdit = () => {
    const validTimes = editTimes.filter(t => /^\d{2}:\d{2}$/.test(t));
    if (validTimes.length > 0) {
      onUpdateTimes(validTimes);
    }
    setModalVisible(false);
  };

  return (
    <View style={[styles.card, {backgroundColor: cardBg}]}>
      {/* Üst kısım: İlaç bilgisi */}
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          <Image
            source={medicineImages[medicine.id]}
            style={styles.medicineImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{medicine.name}</Text>
          <Text style={styles.generic}>
            {medicine.genericName} - {medicine.dosage}
          </Text>
          <Text style={styles.manufacturer}>{medicine.manufacturer}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={openEdit}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Icon name="clock-edit-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Kullanım saatleri */}
      <View style={styles.timesRow}>
        <Icon
          name="clock-outline"
          size={20}
          color={Colors.textSecondary}
        />
        <Text style={styles.timesText}>
          {times.map(t => formatTime24to12(t)).join('  •  ')}
        </Text>
      </View>

      {/* Geri sayım */}
      <View style={styles.countdownSection}>
        <Text style={styles.nextDoseLabel}>
          {Strings.home.nextDose}: {formatTime24to12(countdown.nextTime)}
        </Text>
        <CountdownTimer countdown={countdown} />
      </View>

      {/* Saat Düzenleme Modalı */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{Strings.home.editTime}</Text>
            <Text style={styles.modalSubtitle}>{medicine.name}</Text>

            <ScrollView style={styles.modalScroll}>
              {editTimes.map((time, index) => (
                <View key={index} style={styles.timeInputRow}>
                  <Text style={styles.doseLabel}>
                    {Strings.home.dose} {index + 1}
                  </Text>
                  <TextInput
                    style={styles.timeInput}
                    value={time}
                    onChangeText={text => {
                      const newTimes = [...editTimes];
                      newTimes[index] = text;
                      setEditTimes(newTimes);
                    }}
                    placeholder="HH:MM"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                  {editTimes.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditTimes(editTimes.filter((_, i) => i !== index));
                      }}>
                      <Icon
                        name="close-circle"
                        size={24}
                        color={Colors.warning}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addTimeButton}
                onPress={() => setEditTimes([...editTimes, '12:00'])}>
                <Icon name="plus-circle" size={24} color={Colors.primary} />
                <Text style={styles.addTimeText}>Saat Ekle</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>
                  {Strings.home.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveButtonText}>{Strings.home.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicineImage: {
    width: 60,
    height: 60,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  generic: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  manufacturer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  editButton: {
    padding: 8,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timesText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  countdownSection: {
    marginTop: 14,
    alignItems: 'center',
  },
  nextDoseLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 250,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doseLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    width: 70,
  },
  timeInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  addTimeText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textLight,
  },
});
