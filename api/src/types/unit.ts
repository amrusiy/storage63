export type Unit = {
    id: string,
    name: string,
    parentUnitId: string,
    childUnitIds: string[],
    userIds: string[]
}