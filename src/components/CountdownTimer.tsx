import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../constants/colors';
import {CountdownInfo} from '../types';
import {Strings} from '../constants/strings';

interface Props {
  countdown: CountdownInfo;
}

export function CountdownTimer({countdown}: Props) {
  const {hours, minutes, seconds, isOverdue} = countdown;

  if (isOverdue) {
    return (
      <View style={[styles.container, styles.overdueContainer]}>
        <Text style={styles.overdueText}>{Strings.home.overdue}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeBlocks}>
        <TimeBlock value={hours} label="Saat" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={minutes} label="Dk" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={seconds} label="Sn" />
      </View>
      <Text style={styles.remainingText}>{Strings.home.remaining}</Text>
    </View>
  );
}

function TimeBlock({value, label}: {value: number; label: string}) {
  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeValue}>
        {value.toString().padStart(2, '0')}
      </Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
  },
  overdueContainer: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  overdueText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.warning,
  },
  timeBlocks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 48,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginHorizontal: 2,
    marginBottom: 16,
  },
  remainingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
