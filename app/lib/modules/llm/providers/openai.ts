import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '~/utils/logger';

// Definición de tipos para la respuesta de la API de OpenAI
interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: any[];
  root: string;
  parent: string | null;
  context_window?: number;
}

interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

export default class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';

  config = {
    apiTokenKey: 'OPENAI_API_KEY',
  };

  // Definimos modelos estáticos conocidos para asegurar que siempre estén disponibles
  // incluso si la API no los devuelve o hay problemas de conexión
  staticModels: ModelInfo[] = [
    { name: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', provider: 'OpenAI', maxTokenAllowed: 128000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 128000 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    try {
      // Primero, intentamos obtener la API key
      const { apiKey } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: settings,
        serverEnv: serverEnv as any,
        defaultBaseUrlKey: '',
        defaultApiTokenKey: 'OPENAI_API_KEY',
      });

      // Lista de modelos conocidos de OpenAI (actualizada a abril 2025)
      // Esta lista se utilizará cuando no podamos obtener los modelos de la API
      const knownModels: ModelInfo[] = [
        // GPT-4.1 Series
        { name: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: this.name, maxTokenAllowed: 128000 },

        // GPT-4o Series
        { name: 'gpt-4o', label: 'GPT-4o', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4o-2024-05-13', label: 'GPT-4o (2024-05-13)', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: this.name, maxTokenAllowed: 128000 },

        // GPT-4 Series
        { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4-vision-preview', label: 'GPT-4 Vision', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4-1106-preview', label: 'GPT-4 Turbo Preview (1106)', provider: this.name, maxTokenAllowed: 128000 },
        { name: 'gpt-4', label: 'GPT-4', provider: this.name, maxTokenAllowed: 8000 },
        { name: 'gpt-4-32k', label: 'GPT-4 (32k)', provider: this.name, maxTokenAllowed: 32000 },

        // GPT-3.5 Series
        { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: this.name, maxTokenAllowed: 16000 },
        { name: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo (16k)', provider: this.name, maxTokenAllowed: 16000 },
        { name: 'gpt-3.5-turbo-instruct', label: 'GPT-3.5 Turbo Instruct', provider: this.name, maxTokenAllowed: 4096 },

        // Modelos de incrustación (embeddings)
        { name: 'text-embedding-3-large', label: 'Text Embedding 3 Large', provider: this.name, maxTokenAllowed: 8191 },
        { name: 'text-embedding-3-small', label: 'Text Embedding 3 Small', provider: this.name, maxTokenAllowed: 8191 },
        { name: 'text-embedding-ada-002', label: 'Text Embedding Ada 002', provider: this.name, maxTokenAllowed: 8191 },

        // Modelos de moderación
        { name: 'text-moderation-latest', label: 'Text Moderation Latest', provider: this.name, maxTokenAllowed: 32000 },
        { name: 'text-moderation-stable', label: 'Text Moderation Stable', provider: this.name, maxTokenAllowed: 32000 },

        // Modelos de audio
        { name: 'whisper-1', label: 'Whisper-1', provider: this.name, maxTokenAllowed: 0 },
        { name: 'tts-1', label: 'TTS-1', provider: this.name, maxTokenAllowed: 4096 },
        { name: 'tts-1-hd', label: 'TTS-1-HD', provider: this.name, maxTokenAllowed: 4096 },
      ];

      // Si tenemos una API key, intentamos obtener los modelos de la API
      if (apiKey) {
        try {
          const response = await fetch(`https://api.openai.com/v1/models`, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

          if (response.ok) {
            const res = await response.json() as OpenAIModelsResponse;

            if (res && res.data && Array.isArray(res.data)) {
              // Creamos un conjunto con todos los IDs de modelos conocidos y estáticos para evitar duplicados
              const existingModelIds = new Set([
                ...this.staticModels.map(m => m.name),
                ...knownModels.map(m => m.name)
              ]);

              // Filtramos los modelos que nos interesan de la API
              const apiModels = res.data
                .filter((model: any) =>
                  model &&
                  model.object === 'model' &&
                  model.id &&
                  typeof model.id === 'string' &&
                  (model.id.startsWith('gpt-') || model.id.startsWith('o') || model.id.startsWith('chatgpt-')) &&
                  !existingModelIds.has(model.id) // Evitamos duplicados
                )
                .map((m: any) => ({
                  name: m.id,
                  label: `${m.id}`,
                  provider: this.name,
                  maxTokenAllowed: m.context_window || 32000,
                }));

              // Devolvemos solo los modelos conocidos y los de la API (sin los estáticos)
              return [...knownModels, ...apiModels];
            }
          }
        } catch (error) {
          logger.warn(`Error fetching OpenAI models from API: ${error}, using known models`);
        }
      }

      // Si no pudimos obtener los modelos de la API, devolvemos solo los modelos conocidos (sin los estáticos)
      return knownModels;
    } catch (error) {
      // En caso de error, devolvemos solo los modelos estáticos
      logger.error(`Error getting dynamic models for ${this.name}:`, error);
      return this.staticModels;
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
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      throw new Error(`API key inválida o no configurada para el proveedor ${this.name}. Por favor, configura una API key válida en la configuración del proveedor o en el archivo .env`);
    }

    const openai = createOpenAI({
      apiKey,
    });

    return openai(model);
  }
}
