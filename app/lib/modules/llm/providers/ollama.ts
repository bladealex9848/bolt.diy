import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { logger } from '~/utils/logger';

interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaApiResponse {
  models: OllamaModel[];
}

export default class OllamaProvider extends BaseProvider {
  name = 'Ollama';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
  };

  staticModels: ModelInfo[] = [];

  private _convertEnvToRecord(env?: Env): Record<string, string> {
    if (!env) {
      return {};
    }

    // Convert Env to a plain object with string values
    return Object.entries(env).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  getDefaultNumCtx(serverEnv?: Env): number {
    const envRecord = this._convertEnvToRecord(serverEnv);
    return envRecord.DEFAULT_NUM_CTX ? parseInt(envRecord.DEFAULT_NUM_CTX, 10) : 32768;
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    try {
      let { baseUrl } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: settings,
        serverEnv,
        defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
        defaultApiTokenKey: '',
      });

      if (!baseUrl) {
        throw new Error('No baseUrl found for OLLAMA provider');
      }

      if (typeof window === 'undefined') {
        /*
         * Running in Server
         * Backend: Check if we're running in Docker
         */
        const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || serverEnv?.RUNNING_IN_DOCKER === 'true';

        baseUrl = isDocker ? baseUrl.replace('localhost', 'host.docker.internal') : baseUrl;
        baseUrl = isDocker ? baseUrl.replace('127.0.0.1', 'host.docker.internal') : baseUrl;
      }

      logger.debug('Fetching Ollama models from:', `${baseUrl}/api/tags`);

      const response = await fetch(`${baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Error fetching Ollama models: ${response.statusText}`);
      }

      const data = await response.json() as OllamaApiResponse;

      if (!data.models || !Array.isArray(data.models)) {
        logger.warn('Invalid response format from Ollama API');
        return [];
      }

      logger.debug(`Found ${data.models.length} Ollama models`);

      // Función para estimar el contexto máximo basado en el tamaño del modelo
      const estimateMaxTokens = (model: OllamaModel): number => {
        // Extraer el tamaño del modelo si está disponible
        const paramSize = model.details?.parameter_size || '';

        // Patrones comunes de tamaño de modelo
        if (paramSize.includes('70B') || paramSize.includes('65B')) return 32768;
        if (paramSize.includes('34B') || paramSize.includes('33B')) return 16384;
        if (paramSize.includes('13B') || paramSize.includes('14B')) return 8192;
        if (paramSize.includes('8x7B')) return 32768; // Mixtral
        if (paramSize.includes('7B')) return 8192;
        if (paramSize.includes('3B') || paramSize.includes('2B')) return 4096;

        // Basado en el nombre del modelo
        const name = model.name.toLowerCase();
        if (name.includes('llama3:70b') || name.includes('llama3.1:70b')) return 32768;
        if (name.includes('mixtral')) return 32768;
        if (name.includes('yi:34b')) return 16384;
        if (name.includes('codellama')) return 16384;

        // Valor predeterminado
        return 8192;
      };

      // Función para crear una etiqueta descriptiva
      const createLabel = (model: OllamaModel): string => {
        let label = model.name;

        // Añadir información del tamaño del modelo si está disponible
        if (model.details?.parameter_size) {
          label += ` (${model.details.parameter_size})`;
        }

        // Añadir información de la familia si está disponible
        if (model.details?.family && !label.toLowerCase().includes(model.details.family.toLowerCase())) {
          label += ` - ${model.details.family}`;
        }

        return label;
      };

      // Ordenar modelos por nombre
      const sortedModels = [...data.models].sort((a, b) => {
        // Extraer la familia/base del modelo (antes de los dos puntos)
        const baseA = a.name.split(':')[0];
        const baseB = b.name.split(':')[0];

        // Primero ordenar por familia/base
        if (baseA !== baseB) {
          return baseA.localeCompare(baseB);
        }

        // Luego por nombre completo
        return a.name.localeCompare(b.name);
      });

      return sortedModels.map((model: OllamaModel) => ({
        name: model.name,
        label: createLabel(model),
        provider: this.name,
        maxTokenAllowed: estimateMaxTokens(model),
      }));
    } catch (error) {
      logger.error('Error getting Ollama models:', error);
      return [];
    }
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const envRecord = this._convertEnvToRecord(serverEnv);

    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    // Backend: Check if we're running in Docker
    if (!baseUrl) {
      throw new Error('No baseUrl found for OLLAMA provider');
    }

    const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || envRecord.RUNNING_IN_DOCKER === 'true';
    baseUrl = isDocker ? baseUrl.replace('localhost', 'host.docker.internal') : baseUrl;
    baseUrl = isDocker ? baseUrl.replace('127.0.0.1', 'host.docker.internal') : baseUrl;

    logger.debug('Ollama Base Url used: ', baseUrl);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
    }) as LanguageModelV1 & { config: any };

    ollamaInstance.config.baseURL = `${baseUrl}/api`;

    return ollamaInstance;
  };
}
