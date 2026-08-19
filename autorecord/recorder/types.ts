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
  /** The prompt to send. For multi-turn pages this is the first one. */
  prompt: string;
  /**
   * Ordered prompts for pages that drive several turns or tabs. Previously these
   * lived hardcoded inside the action handlers while `prompt` sat unused and
   * disagreeing with them; keeping them here makes the config the single source.
   */
  prompts?: string[];
  waitAfterPromptMs?: number;
}

export type PageActionHandler = (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
) => Promise<void>;
