export interface Question {
    id: number;
    q: string;
    o: string[];
    a: number | number[];
    ex: string;
}

export interface SM2Data {
    n: number;
    ef: number;
    i: number;
    next: number;
    attempts: number;
    correct: number;
    lastCorrect?: boolean;
    lastSelected?: number | number[];
}

export interface SessionQuestion extends Question {
    sm2: SM2Data;
    accuracy: number;
    isFirstTry: boolean;
}
