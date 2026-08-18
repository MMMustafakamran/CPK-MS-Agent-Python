import { type Page } from 'playwright';
import { type IdeTabConfig } from './ide/generator';

export interface PageRecordConfig {
  id: string;
  name: string;
  filename?: string;
  docUrl: string;
  ideFile: string;
  ideLine?: number;
  startLine: number;
  endLine: number;
  extraTabs?: IdeTabConfig[];
  demoUrl: string;
  prompt: string;
  waitAfterPromptMs?: number;
}

export type PageActionHandler = (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
) => Promise<void>;
