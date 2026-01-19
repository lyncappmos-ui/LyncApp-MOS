
import { ConsumerType, MOSCapability } from '../types';

/**
 * LyncApp MOS Auth Service (Production Grade)
 * RESPONSIBILITY: Managing Platform Access Keys and Capability Mapping.
 */
export class AuthService {
  // Mock internal key store - in production, this is synced from a secure vault/DB
  private static readonly PLATFORM_KEYS: Record<string, { role: ConsumerType; label: string }> = {
    "mos_pk_control_live_8291": { role: "platform_control", label: "Global Control Tower" },
    "mos_pk_growth_data_0021": { role: "platform_growth", label: "Growth Engine" },
    "mos_pk_admin_global_7734": { role: "sacco_admin", label: "Fleet SuperAdmin" }
  };

  private static readonly CAPABILITY_MATRIX: Record<ConsumerType, MOSCapability[]> = {
    operator_terminal: ['system_health'],
    sacco_admin: ['system_health', 'operational_metrics', 'trust_metrics', 'revenue_integrity', 'audit_logs'],
    platform_control: ['system_health', 'operational_metrics', 'revenue_integrity', 'audit_logs'],
    platform_growth: ['growth_metrics', 'acquisition_metrics', 'projections']
  };

  /**
   * Validates a platform key and ensures it has the required capability.
   */
  static authorize(key: string, requiredCapability: MOSCapability): { role: ConsumerType; label: string } {
    const config = this.PLATFORM_KEYS[key];
    if (!config) {
      throw new Error("E001: UNAUTHORIZED_ACCESS - Invalid Platform Key.");
    }

    const allowedCapabilities = this.CAPABILITY_MATRIX[config.role];
    if (!allowedCapabilities.includes(requiredCapability)) {
      throw new Error(`E003: INSUFFICIENT_PERMISSIONS - Consumer [${config.label}] lacks [${requiredCapability}] capability.`);
    }

    return config;
  }

  static getConsumerInfo(key: string) {
    return this.PLATFORM_KEYS[key] || null;
  }
}
