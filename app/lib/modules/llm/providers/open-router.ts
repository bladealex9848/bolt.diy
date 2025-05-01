import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description?: string;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
    tokenizer?: string;
  };
  top_provider?: {
    is_moderated?: boolean;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
    input_cache_read?: string;
    input_cache_write?: string;
    web_search?: string;
    internal_reasoning?: string;
  };
  context_length: number;
  per_request_limits?: Record<string, string>;
  supported_parameters?: string[];
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export default class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/settings/keys';

  config = {
    apiTokenKey: 'OPEN_ROUTER_API_KEY',
  };

  staticModels: ModelInfo[] = [];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    try {
      // Obtener la API key de OpenRouter
      const apiKey = apiKeys?.[this.name] || _serverEnv?.OPEN_ROUTER_API_KEY || process?.env?.OPEN_ROUTER_API_KEY;

      // Configurar los headers para la solicitud
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Añadir la API key si está disponible
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Realizar la solicitud a la API de OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error fetching OpenRouter models: ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterModelsResponse;

      // Verificar que la respuesta tenga la estructura esperada
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      // Filtrar modelos gratuitos (con ":free" en el ID)
      // y organizar por categorías
      const models = data.data
        .filter((model: any) => model.id && typeof model.id === 'string')
        .sort((a: any, b: any) => {
          // Ordenar primero por organización/proveedor
          const orgA = a.id.split('/')[0] || '';
          const orgB = b.id.split('/')[0] || '';

          if (orgA !== orgB) {
            return orgA.localeCompare(orgB);
          }

          // Luego por nombre de modelo
          return a.id.localeCompare(b.id);
        })
        .map((model: any) => {
          // Determinar si el modelo es multimodal
          const isMultimodal = model.architecture?.input_modalities?.includes('image');

          // Calcular el contexto en K (miles de tokens)
          const contextK = model.context_length ? Math.floor(model.context_length / 1000) : 8;

          // Formatear el precio para mostrar
          const promptPrice = model.pricing?.prompt ?
            `$${(parseFloat(model.pricing.prompt) * 1_000_000).toFixed(2)}` : 'N/A';

          // Crear una etiqueta descriptiva
          let label = model.name || model.id;

          // Añadir información de contexto y precio
          label += ` (${contextK}K`;

          // Añadir indicador de multimodal si corresponde
          if (isMultimodal) {
            label += ', Multimodal';
          }

          // Añadir información de precio
          label += `, ${promptPrice}/1M tokens)`;

          return {
            name: model.id,
            label: label,
            provider: this.name,
            maxTokenAllowed: model.context_length || 8192,
          };
        });

      return models;
    } catch (error) {
      console.error('Error getting OpenRouter models:', error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPEN_ROUTER_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openRouter = createOpenRouter({
      apiKey,
    });
    const instance = openRouter.chat(model) as LanguageModelV1;

    return instance;
  }
}
