import type { MercosPedidoItem } from "../contracts/mercos-order.ts";

export class CalculateDiscount{
    static calcularDescontosItem(itens: MercosPedidoItem, valorProd: number) {
   
        let descontoProm = 0;
    for (const d of itens.descontos_de_promocoes || []) {
      descontoProm = valorProd * (d.desconto / 100);
    }

    let des1 = 0;
    let des2 = 0;
    let descontoP = 0;
    for (const d of itens.descontos_de_politicas || []) {
      if (des1 > 0) {
        des2 = des1 * (d.desconto / 100);
      }
      descontoP = descontoP + d.desconto;
      des1 = d.desconto;
    }
    const subDesconto = descontoP - des2;
    const descontoPoliticas = valorProd * (subDesconto / 100);

    let descontoVend = 0;
    for (const dv of itens.descontos_do_vendedor || []) {
      descontoVend = (valorProd - descontoProm) * (dv / 100);
    }

    const descontoTotal = descontoProm + descontoVend + descontoPoliticas;
    return { descontoProm, descontoVend, descontoPoliticas, descontoTotal };
  }
}