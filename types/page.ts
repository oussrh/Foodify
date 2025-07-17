import type { PageProps } from 'next'

export interface AppPageProps<
  Params extends Record<string, string> = {},
  SearchParams extends Record<string, string | string[] | undefined> = {}
> extends PageProps<Params, SearchParams> {}
