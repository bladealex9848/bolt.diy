import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '~/utils/logger';

// Definición de tipos para la respuesta de la API de Google
interface GoogleModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}

interface GoogleModelsResponse {
  models: GoogleModel[];
}

export default class GoogleProvider extends BaseProvider {
  name = 'Google';
  getApiKeyLink = 'https://aistudio.google.com/app/apikey';

  config = {
    apiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  };

  // Definimos modelos estáticos conocidos para asegurar que siempre estén disponibles
  // incluso si la API no los devuelve o hay problemas de conexión
  staticModels: ModelInfo[] = [
    { name: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-2.0-pro-vision', label: 'Gemini 2.0 Pro Vision', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-2.0-flash-vision', label: 'Gemini 2.0 Flash Vision', provider: 'Google', maxTokenAllowed: 1048576 },
    {
      name: 'gemini-2.0-flash-thinking-exp-01-21',
      label: 'Gemini 2.0 Flash Thinking Exp',
      provider: 'Google',
      maxTokenAllowed: 1048576,
    },
    { name: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (latest)', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-pro-vision-latest', label: 'Gemini 1.5 Pro Vision (latest)', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-pro-002', label: 'Gemini 1.5 Pro 002', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (latest)', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-flash-vision-latest', label: 'Gemini 1.5 Flash Vision (latest)', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-flash-002', label: 'Gemini 1.5 Flash 002', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', provider: 'Google', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.0-pro-latest', label: 'Gemini 1.0 Pro (latest)', provider: 'Google', maxTokenAllowed: 32768 },
    { name: 'gemini-1.0-pro-vision-latest', label: 'Gemini 1.0 Pro Vision (latest)', provider: 'Google', maxTokenAllowed: 32768 },
    { name: 'gemini-1.0-pro-001', label: 'Gemini 1.0 Pro 001', provider: 'Google', maxTokenAllowed: 32768 },
    { name: 'gemini-1.0-pro-vision-001', label: 'Gemini 1.0 Pro Vision 001', provider: 'Google', maxTokenAllowed: 32768 },
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
        defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
      });

      // Lista de modelos conocidos de Google Gemini (actualizada a abril 2025)
      // Esta lista se utilizará cuando no podamos obtener los modelos de la API
      const knownModels: ModelInfo[] = [
        // Gemini 2.5 Series
        { name: 'gemini-2.5-pro-preview-03-25', label: 'Gemini 2.5 Pro Preview (03-25)', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview (04-17)', provider: this.name, maxTokenAllowed: 1048576 },

        // Gemini 2.0 Series
        { name: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.0-pro-vision', label: 'Gemini 2.0 Pro Vision', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.0-flash-vision', label: 'Gemini 2.0 Flash Vision', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.0-flash-thinking-exp-01-21', label: 'Gemini 2.0 Flash Thinking Exp', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-2.0-flash-live-001', label: 'Gemini 2.0 Flash Live', provider: this.name, maxTokenAllowed: 1048576 },

        // Gemini 1.5 Series
        { name: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (latest)', provider: this.name, maxTokenAllowed: 2097152 },
        { name: 'gemini-1.5-pro-vision-latest', label: 'Gemini 1.5 Pro Vision (latest)', provider: this.name, maxTokenAllowed: 2097152 },
        { name: 'gemini-1.5-pro-002', label: 'Gemini 1.5 Pro 002', provider: this.name, maxTokenAllowed: 2097152 },
        { name: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (latest)', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-1.5-flash-vision-latest', label: 'Gemini 1.5 Flash Vision (latest)', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-1.5-flash-002', label: 'Gemini 1.5 Flash 002', provider: this.name, maxTokenAllowed: 1048576 },
        { name: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', provider: this.name, maxTokenAllowed: 1048576 },

        // Gemini 1.0 Series
        { name: 'gemini-1.0-pro-latest', label: 'Gemini 1.0 Pro (latest)', provider: this.name, maxTokenAllowed: 32768 },
        { name: 'gemini-1.0-pro-vision-latest', label: 'Gemini 1.0 Pro Vision (latest)', provider: this.name, maxTokenAllowed: 32768 },
        { name: 'gemini-1.0-pro-001', label: 'Gemini 1.0 Pro 001', provider: this.name, maxTokenAllowed: 32768 },
        { name: 'gemini-1.0-pro-vision-001', label: 'Gemini 1.0 Pro Vision 001', provider: this.name, maxTokenAllowed: 32768 },

        // Imagen y Veo
        { name: 'imagen-3.0-generate-002', label: 'Imagen 3.0 Generate', provider: this.name, maxTokenAllowed: 4096 },
        { name: 'veo-2.0-generate-001', label: 'Veo 2.0 Generate', provider: this.name, maxTokenAllowed: 4096 },

        // Embeddings
        { name: 'gemini-embedding-exp-03-07', label: 'Gemini Embedding Exp', provider: this.name, maxTokenAllowed: 8192 },
        { name: 'text-embedding-004', label: 'Text Embedding 004', provider: this.name, maxTokenAllowed: 2048 },
      ];

      // Si tenemos una API key, intentamos obtener los modelos de la API
      if (apiKey) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            headers: {
              ['Content-Type']: 'application/json',
            },
          });

          if (response.ok) {
            const res = await response.json() as GoogleModelsResponse;

            if (res && res.models && Array.isArray(res.models)) {
              // Creamos un conjunto con todos los IDs de modelos conocidos y estáticos para evitar duplicados
              const existingModelIds = new Set([
                ...this.staticModels.map(m => m.name),
                ...knownModels.map(m => m.name)
              ]);

              // Filtramos los modelos que nos interesan
              const apiModels = res.models
                .filter((model) =>
                  model &&
                  model.outputTokenLimit > 8000 &&
                  !existingModelIds.has(model.name.replace('models/', ''))
                )
                .map((m) => ({
                  name: m.name.replace('models/', ''),
                  label: `${m.displayName} - context ${Math.floor((m.inputTokenLimit + m.outputTokenLimit) / 1000) + 'k'}`,
                  provider: this.name,
                  maxTokenAllowed: m.inputTokenLimit + m.outputTokenLimit || 8000,
                }));

              // Devolvemos solo los modelos conocidos y los de la API (sin los estáticos)
              return [...knownModels, ...apiModels];
            }
          }
        } catch (error) {
          logger.warn(`Error fetching Google models from API: ${error}, using known models`);
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
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    return google(model);
  }
}
