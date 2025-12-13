import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const SimpleBarChart = ({ data, labels, maxValue, height = 150 }) => {
  const { colors } = useContext(ThemeContext);
  const [expanded, setExpanded] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);

  // Find highest value
  const actualMaxValue = maxValue || Math.max(...data.map(d => d.value), 1);

  const handleBarPress = (index) => {
    setSelectedBar(selectedBar === index ? null : index);
  };

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
              const isSelected = selectedBar === index;
              return (
                <View key={index} style={styles.barGroup}>
                  {/* Tooltip/Popup - positioned outside barWrapper */}
                  {isSelected && (
                    <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.tooltipText, { color: colors.text }]}>{item.value}</Text>
                      <View style={[styles.tooltipArrow, { borderTopColor: colors.surface }]} />
                    </View>
                  )}
                  <View style={styles.barWrapper}>
                    <TouchableOpacity
                      onPress={() => handleBarPress(index)}
                      activeOpacity={0.7}
                      style={{ width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}
                    >
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barHeight, 2),
                            backgroundColor: isSelected ? colors.primaryDark || colors.primary : colors.primary
                          }
                        ]}
                      />
                    </TouchableOpacity>
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
  tooltip: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
    minWidth: 30,
  },
  tooltipText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default SimpleBarChart;

