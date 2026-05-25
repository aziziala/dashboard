export interface PromoCode{
    id?:number;
    code?:string;
    discountPercentage?:number;
    active?:boolean;
    expirationDate?:Date;
    createdAT?:Date;
    description:string;
}