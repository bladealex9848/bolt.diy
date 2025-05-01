import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

interface AWSBedRockConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export default class AmazonBedrockProvider extends BaseProvider {
  name = 'AmazonBedrock';
  getApiKeyLink = 'https://console.aws.amazon.com/iam/home';

  config = {
    apiTokenKey: 'AWS_BEDROCK_CONFIG',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
      label: 'Claude 3.7 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      label: 'Claude 3.5 Sonnet v2 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      label: 'Claude 3.5 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-opus-20240229-v1:0',
      label: 'Claude 3 Opus (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-sonnet-20240229-v1:0',
      label: 'Claude 3 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-haiku-20240307-v1:0',
      label: 'Claude 3 Haiku (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'meta.llama3-70b-instruct-v1:0',
      label: 'Llama 3 70B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8192,
    },
    {
      name: 'meta.llama3-8b-instruct-v1:0',
      label: 'Llama 3 8B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8192,
    },
    {
      name: 'meta.llama3-1-8b-instruct-v1:0',
      label: 'Llama 3.1 8B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8192,
    },
    {
      name: 'meta.llama3-1-70b-instruct-v1:0',
      label: 'Llama 3.1 70B Instruct (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8192,
    },
    {
      name: 'amazon.nova-pro-v1:0',
      label: 'Amazon Nova Pro (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 5120,
    },
    {
      name: 'amazon.nova-lite-v1:0',
      label: 'Amazon Nova Lite (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 5120,
    },
    {
      name: 'mistral.mistral-large-2402-v1:0',
      label: 'Mistral Large 24.02 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral.mistral-large-2407-v1:0',
      label: 'Mistral Large 24.07 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral.mixtral-8x7b-v3:0',
      label: 'Mixtral 8x7B v3 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32768,
    },
    {
      name: 'cohere.command-r-v1:0',
      label: 'Cohere Command R (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 4096,
    },
    {
      name: 'cohere.command-r-plus-v1:0',
      label: 'Cohere Command R+ (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 4096,
    },
    {
      name: 'cohere.command-light-v1:0',
      label: 'Cohere Command Light (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 4096,
    },
  ];

  private _parseAndValidateConfig(apiKey: string): AWSBedRockConfig {
    let parsedConfig: AWSBedRockConfig;

    try {
      parsedConfig = JSON.parse(apiKey);
    } catch {
      throw new Error(
        'Invalid AWS Bedrock configuration format. Please provide a valid JSON string containing region, accessKeyId, and secretAccessKey.',
      );
    }

    const { region, accessKeyId, secretAccessKey, sessionToken } = parsedConfig;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing required AWS credentials. Configuration must include region, accessKeyId, and secretAccessKey.',
      );
    }

    return {
      region,
      accessKeyId,
      secretAccessKey,
      ...(sessionToken && { sessionToken }),
    };
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
      defaultApiTokenKey: 'AWS_BEDROCK_CONFIG',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const config = this._parseAndValidateConfig(apiKey);
    const bedrock = createAmazonBedrock(config);

    return bedrock(model);
  }
}
