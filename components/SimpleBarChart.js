import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const SimpleBarChart = ({ data, labels, maxValue, height = 150 }) => {
  const { colors } = useContext(ThemeContext);
  const [expanded, setExpanded] = useState(false);
  
  // Find highest value
  const actualMaxValue = maxValue || Math.max(...data.map(d => d.value), 1);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={[styles.header, { marginBottom: expanded ? 12 : 0 }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: colors.text }]}>📊 Trend Grafiği</Text>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={[styles.chartContainer, { height }]}>
          <View style={styles.chartArea}>
            {data.map((item, index) => {
              const barHeight = actualMaxValue > 0 ? (item.value / actualMaxValue) * (height - 40) : 0;
              return (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar,
                        { 
                          height: Math.max(barHeight, 2),
                          backgroundColor: colors.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
                    {labels[index] || ''}
                  </Text>
                </View>
              );
            })}
          </View>
          {data.length > 0 && (
            <View style={styles.valueContainer}>
              <Text style={[styles.maxValue, { color: colors.textTertiary }]}>0</Text>
              <Text style={[styles.maxValue, { color: colors.textTertiary }]}>{actualMaxValue}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    position: 'relative',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingBottom: 30,
    paddingHorizontal: 8,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  barWrapper: {
    width: '80%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 50,
  },
  valueContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  maxValue: {
    fontSize: 10,
  },
});

export default SimpleBarChart;
