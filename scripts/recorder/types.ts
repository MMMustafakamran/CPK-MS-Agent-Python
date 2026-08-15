import { type Page } from 'playwright';

export interface PageRecordConfig {
  id: string;
  name: string;
  docUrl: string;
  ideFile: string;
  ideLine?: number;
  startLine: number;
  endLine: number;
  demoUrl: string;
  prompt: string;
  waitAfterPromptMs?: number;
}

export type PageActionHandler = (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
) => Promise<void>;
