export type User = {
    id: string,
    unitId: string,
    firstname: string,
    lastname: string,
    username: string,
    password: string,
    permission: "admin" | "user"
}