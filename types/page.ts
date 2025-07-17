export interface AppPageProps<
  Params extends Record<string, string> = {},
  SearchParams extends Record<string, string | string[] | undefined> = {}
> {
  params: Params
  searchParams: SearchParams
}
