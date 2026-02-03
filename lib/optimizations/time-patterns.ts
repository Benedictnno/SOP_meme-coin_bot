// lib/optimizations/time-patterns.ts
// ADVANCED OPTIMIZATION: Time-of-day pattern analysis

export interface TimePattern {
  hour: number;
  alertCount: number;
  successRate: number;
  avgReturn: number;
}

/**
 * Track when valid alerts appear and their success rates
 */
export async function recordTimePattern(
  hour: number,
  wasSuccessful: boolean,
  returnPercent: number
): Promise<void> {
  try {
    const storageKey = 'time-patterns';
    
    let patterns: TimePattern[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      alertCount: 0,
      successRate: 0,
      avgReturn: 0
    }));

    try {
      const stored = await window.localStorage.get(storageKey);
      if (stored) {
        patterns = JSON.parse(stored.value);
      }
    } catch (err) {
      // Use default
    }

    // Update pattern for this hour
    const hourPattern = patterns[hour];
    hourPattern.alertCount++;
    
    // Update success rate (weighted average)
    const prevSuccessCount = hourPattern.successRate * (hourPattern.alertCount - 1);
    const newSuccessCount = prevSuccessCount + (wasSuccessful ? 1 : 0);
    hourPattern.successRate = newSuccessCount / hourPattern.alertCount;

    // Update average return
    const prevTotalReturn = hourPattern.avgReturn * (hourPattern.alertCount - 1);
    const newTotalReturn = prevTotalReturn + returnPercent;
    hourPattern.avgReturn = newTotalReturn / hourPattern.alertCount;

    await window.localStorage.set(storageKey, JSON.stringify(patterns));

  } catch (error) {
    console.error('Time pattern recording error:', error);
  }
}

/**
 * Get optimal trading hours based on historical data
 */
export async function getOptimalTradingHours(): Promise<{
  bestHours: number[];
  worstHours: number[];
  recommendation: string;
}> {
  try {
    const storageKey = 'time-patterns';
    const stored = await window.localStorage.get(storageKey);
    
    if (!stored) {
      return {
        bestHours: [14, 15, 16], // Default to US market open
        worstHours: [2, 3, 4],    // Default to low activity hours
        recommendation: 'Insufficient data - using defaults (US market hours)'
      };
    }

    const patterns: TimePattern[] = JSON.parse(stored.value);

    // Filter hours with at least 5 alerts
    const significantHours = patterns.filter(p => p.alertCount >= 5);

    if (significantHours.length < 3) {
      return {
        bestHours: [14, 15, 16],
        worstHours: [2, 3, 4],
        recommendation: 'Insufficient data - collect 5+ alerts per hour'
      };
    }

    // Sort by success rate * avg return (composite score)
    const sorted = [...significantHours].sort((a, b) => {
      const scoreA = a.successRate * Math.max(0, a.avgReturn);
      const scoreB = b.successRate * Math.max(0, b.avgReturn);
      return scoreB - scoreA;
    });

    const bestHours = sorted.slice(0, 3).map(p => p.hour);
    const worstHours = sorted.slice(-3).map(p => p.hour);

    const bestAvgReturn = sorted.slice(0, 3).reduce((sum, p) => sum + p.avgReturn, 0) / 3;

    return {
      bestHours,
      worstHours,
      recommendation: `Best hours: ${bestHours.map(h => `${h}:00`).join(', ')} (avg return: ${bestAvgReturn.toFixed(1)}%)`
    };

  } catch (error) {
    console.error('Optimal hours calculation error:', error);
    return {
      bestHours: [14, 15, 16],
      worstHours: [2, 3, 4],
      recommendation: 'Error calculating - using defaults'
    };
  }
}

/**
 * Should we scan more frequently during this hour?
 */
export async function getDynamicScanInterval(currentHour: number): Promise<{
  interval: number;
  reasoning: string;
}> {
  try {
    const { bestHours, worstHours } = await getOptimalTradingHours();

    // High activity hours: scan every 60 seconds
    if (bestHours.includes(currentHour)) {
      return {
        interval: 60,
        reasoning: 'Peak trading hour - scanning frequently'
      };
    }

    // Low activity hours: scan every 5 minutes
    if (worstHours.includes(currentHour)) {
      return {
        interval: 300,
        reasoning: 'Low activity hour - scanning less frequently to save API calls'
      };
    }

    // Normal hours: scan every 2 minutes
    return {
      interval: 120,
      reasoning: 'Normal trading hour - standard scan frequency'
    };

  } catch (error) {
    console.error('Dynamic interval error:', error);
    return {
      interval: 120,
      reasoning: 'Default interval (error occurred)'
    };
  }
}

/**
 * Get time-based alert multiplier
 * Boost alerts during high-success hours
 */
export async function getTimeMultiplier(hour: number): Promise<number> {
  try {
    const storageKey = 'time-patterns';
    const stored = await window.localStorage.get(storageKey);
    
    if (!stored) {
      return 1.0; // No boost
    }

    const patterns: TimePattern[] = JSON.parse(stored.value);
    const hourPattern = patterns[hour];

    if (hourPattern.alertCount < 5) {
      return 1.0; // Not enough data
    }

    // Calculate multiplier based on success rate
    if (hourPattern.successRate > 0.6) {
      return 1.3; // 30% boost for high success hours
    }

    if (hourPattern.successRate > 0.4) {
      return 1.0; // Normal
    }

    return 0.7; // Reduce urgency for low success hours

  } catch (error) {
    console.error('Time multiplier error:', error);
    return 1.0;
  }
}

/**
 * Export time patterns for analysis
 */
export async function exportTimeAnalysis(): Promise<string> {
  try {
    const storageKey = 'time-patterns';
    const stored = await window.localStorage.get(storageKey);
    
    if (!stored) {
      return 'No time pattern data available';
    }

    const patterns: TimePattern[] = JSON.parse(stored.value);

    let csv = 'Hour,Alert Count,Success Rate,Avg Return %\n';
    
    patterns.forEach(p => {
      if (p.alertCount > 0) {
        csv += `${p.hour}:00,${p.alertCount},${(p.successRate * 100).toFixed(1)}%,${p.avgReturn.toFixed(1)}%\n`;
      }
    });

    return csv;

  } catch (error) {
    console.error('Export error:', error);
    return 'Error exporting time analysis';
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * 1. Record Every Alert Outcome
 *    await recordTimePattern(
 *      new Date().getHours(),
 *      tradeWasSuccessful,
 *      returnPercent
 *    );
 * 
 * 2. Adjust Scan Frequency
 *    const { interval } = await getDynamicScanInterval(currentHour);
 *    setScanInterval(interval);
 * 
 * 3. Apply Time-Based Scoring
 *    const multiplier = await getTimeMultiplier(currentHour);
 *    const adjustedScore = baseScore * multiplier;
 * 
 * 4. Weekly Analysis
 *    const csv = await exportTimeAnalysis();
 *    // Analyze to optimize strategy
 */

/**
 * Day of week patterns
 */
export interface DayPattern {
  day: number; // 0 = Sunday, 6 = Saturday
  alertCount: number;
  successRate: number;
}

export async function getDayOfWeekPattern(): Promise<{
  bestDays: string[];
  worstDays: string[];
}> {
  // Similar implementation to time patterns but for days of week
  // Left as exercise - track Monday-Sunday success rates
  
  return {
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'], // Midweek typically best
    worstDays: ['Saturday', 'Sunday'] // Weekends typically slower
  };
}