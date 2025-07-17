declare module "next" {
  export interface PageProps<
    Params extends Record<string, string> = {},
    SearchParams extends Record<string, string | string[] | undefined> = {}
  > {
    params: Params
    searchParams: SearchParams
  }
}
export {};
