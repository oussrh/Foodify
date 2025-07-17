// types/page.ts 
export interface TypedPageProps<
  Params extends Record<string, string> = {},
  SearchParams extends Record<string, string | string[] | undefined> = {}
> {
  params: Promise<Params>
  searchParams?: Promise<SearchParams>
}
