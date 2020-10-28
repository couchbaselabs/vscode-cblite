export interface Database {
    execute(query: string, callback?: (result: string, err?: Error) => void): void;
    close(callback?: (err?: Error) => void): void;
}