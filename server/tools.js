import axios from "axios"
import { z } from "zod"
import { addProduct, editQuantity, getOrderDetails, removeProduct,editAddress, applyDiscount, cancelOrder, orderList, acceptRefund } from "./ae.tool.js"
import { MongoClient } from 'mongodb';
import ollama from 'ollama';

const EMBEDDING_MODEL = 'qllama/bge-small-en-v1.5';
const MONGO_URI = 'mongodb+srv://support:7X0xez7E3O0zkwPX@cluster0.pn5axpz.mongodb.net/';
const DATABASE = 'accounteditor';
const COLLECTION_ORDERS = 'appmockorders';
const COLLECTION_EDITS = 'ordereditinghistories'


function addTwoNumbers({ a, b }) {
    return {
        content: [
            {
                type: "text",
                text: `The sum of ${a} and ${b} is ${a + b}`
            }
        ]
    };
}

// export function registerTools(server) {
//     // add numbers
//     server.tool(
//         "addTwoNumbers",
//         "Add two numbers",
//         {
//             a: z.number(),
//             b: z.number()
//         },
//         async (arg) => addTwoNumbers(arg)
//     );

//     // // get products
//     // server.tool(
//     //     "get_products_ae",
//     //     "Get all the products from within the shop",
//     //     {
//     //         query: z.string(),
//     //         context: z.string().optional(),
//     //     },
//     //     async (arg) => getProducts(arg.query)
//     // );

//     // order details
//     server.tool(
//         "get_order_details_ae",
//         "Get all the order details of the product",
//         {
//             query: z.string(),
//             orderId: z.string(),
//             context: z.string().optional(),
//         },
//         async (arg) => {
//             const {query, context, orderId} = arg;
//             const data = await getOrderDetails(query, context, orderId)
//             console.log("----------------------------------------------------------------- ",data)
//             // return getOrderDetails(query, context, orderId);

//             const prompt = `
//         You are an AI assistant for an ecommerce store. Summarize the following order details for the customer in a clear, friendly, and concise way. 
// Highlight order number, items, quantities, prices, shipping status, and any other important info. 
// Do not include raw JSON or technical details in your summary.

// Order details (JSON):
// ${JSON.stringify(data, null, 2)}
// Products inside this image(JSON):
// ${console.log("---------------------------- products ", JSON.stringify(data?.result?.lineItems, null, 2))}
// ${JSON.stringify(data?.result?.lineItems, null, 2)}
//         `.trim();
//             return { 
//                 content: [
//                     {
//                         type: "text",
//                         text: prompt
//                     }
//                 ]
//             };
//         }
//     );

//     // add product
//     server.tool(
//         "add_product_ae",
//         "Add products in the order that is already placed.",
//         {
//             query: z.string().optional(), 
//             context: z.string().optional(), 
//             orderId: z.string(), 
//             customerId: z.string(), 
//             productVariantId: z.string(), 
//             quantity: z.number()
//         },
//         async (arg) => {
//             const {query, context, orderId, customerId, productVariantId, quantity} = arg;
//             // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, quantity)
//             const data = await addProduct(query, context, orderId, customerId, productVariantId, quantity)
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     )
    
//     // remove product
//     server.tool(
//         "remove_product_ae",
//         "Remove products in the order that is already placed.",
//         {
//             query: z.string().optional(), 
//             context: z.string().optional(), 
//             orderId: z.string(), 
//             customerId: z.string(), 
//             productVariantId: z.string(), 
//             calculatedLineItemId: z.string()
//         },
//         async (arg) => {
//             const {query, context, orderId, customerId, productVariantId, calculatedLineItemId} = arg;
//             // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, calculatedLineItemId)
//             const data = await removeProduct(query, context, orderId, customerId, productVariantId, calculatedLineItemId)
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     )

//     // edit quantity
//     server.tool(
//         "edit_quantity_ae",
//         "Remove products in the order that is already placed.",
//         {
//             query: z.string().optional(), 
//             context: z.string().optional(),
//             orderId: z.string(),     
//             calculatedLineItemId: z.string(),
//             quantity: z.number(),
//             oldQuantity: z.number(),
//             customerId: z.string(),
//             productVariantId: z.string()
//         },
//         async (arg) => {
//             const {query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity} = arg;
//             // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, calculatedLineItemId)
//             const data = await editQuantity(query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity)
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     )

//     // edit address
//     server.tool(
//         "edit_address_ae",
//         "Edit the address in the order that is already placed.",
//         {
//             query: z.string().optional(), 
//             context: z.string().optional(),
//             customerId: z.string(),
//             address1: z.string(),
//             address2: z.string(),
//             orderId: z.string(),
//             city: z.string(),
//             country: z.string(),
//             firstName: z.string(),
//             lastName: z.string(),
//             phone: z.string(),
//             province: z.string(),
//             provinceCode: z.string(),
//             zip: z.string()
//         },
//         async (arg) => {
//             const {query, context, orderId, customerId, address1, address2, city, country, firstName, lastName, phone, province, provinceCode, zip} = arg;
//             // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, calculatedLineItemId)
//             const data = await editAddress(query, context, orderId, customerId, address1, address2, city, country, firstName, lastName, phone, province, provinceCode, zip)
//             console.log(data.data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     )


//     server.tool(
//         "apply_discount_ae",
//         "Apply a discount to the order that is already placed.",
//         {
//             query: z.string().optional(), 
//             context: z.string().optional(),
//             orderId: z.string(),
//             discountCode: z.string(),
//             isChecking: z.boolean().default(false),
//             removeOldDiscount: z.boolean().default(false)
//         },
//         async (arg) => {
//             const {query, context, orderId, customerId, discountCode, isChecking, removeOldDiscount} = arg;
//             // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, calculatedLineItemId)
//             const data = await applyDiscount(query, context, orderId, customerId, discountCode, isChecking, removeOldDiscount)
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     )

//     // products list
//     server.tool(
//         "search_shop_catalog",
//         "Search the shop catalog using remote MCP server",
//         {
//           query: z.string().optional().default(""),
//           context: z.string().optional().default(""),
//           storefrontUrl: z.string()
//         },
//         async (arg) => {
//             const { query, context, storefrontUrl } = arg
//             try {

//                 const data = {
//                     jsonrpc: "2.0",
//                     method: "tools/call",
//                     id: 1,
//                     params: {
//                         name: "search_shop_catalog",
//                         arguments: {
//                             query: query ? query : "",
//                             context: context ? context : ""
//                         }
//                     }
//                 }
//               // Send MCP-formatted request to external MCP server
//               const response = await axios.post(`https://${storefrontUrl}/api/mcp`, 
//                 data, 
//                 {
//                     headers: {
//                         "Content-Type": "application/json"
//                     },
//                 });
//               const json = await response.data;

//           if (!json.result || !json.result.content) {
//             return {
//               content: [
//                 {
//                   type: "text",
//                   text: "Remote server returned no content."
//                 }
//               ]
//             };
//           }

//           // Return the content exactly as received from remote MCP
//           return {
//             content: json.result.content
//           };

//         } catch (err) {
//           console.error("Error contacting remote MCP server:", err);
//           return {
//             content: [
//               {
//                 type: "text",
//                 text: "Failed to contact the remote MCP server."
//               }
//             ]
//           };
//         }
//       }
//     );


//     // cancel order
//     server.tool(
//         "cancel_order_ae",
//         "Cancel an existing order",
//         {
//             query: z.string().optional(),
//             context: z.string().optional(),
//             orderId: z.string(),
//             currencyCode: z.string(),
//             customerId: z.string(),
//             customerRefundedAmount: z.number().min(0).optional(),
//             refund: z.boolean().default(false),
//             restock: z.boolean().default(false),
//             staffNote: z.string().max(500).optional(),
//             totalAmount: z.string()
//         },
//         async (arg) => {
//             const { query, context, orderId, currencyCode, customerId, customerRefundedAmount, refund, restock, staffNote, totalAmount } = arg;
//             const data = await cancelOrder(query, context, orderId, currencyCode, customerId, customerRefundedAmount, refund, restock, staffNote, totalAmount );
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     );

//     // order list 
//     server.tool(
//         "orders_list_ae",
//         "Get List of the orders for the customer",
//         {
//             query: z.string().optional(),
//             context: z.string().optional(),
//             customerId: z.string(),
//             type: z.string().default("").optional(),
//             cursor: z.string().default("").optional()
//         },
//         async (arg) => {
//             const { query, context, customerId, type, cursor } = arg;
//             const data = await orderList(query, context, customerId, type, cursor);
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     );

//     // accept refund 
//     server.tool(
//         "accept_refund_ae",
//         "Accept the refund for the order",
//         {
//             query: z.string().optional(),
//             context: z.string().optional(),
//             orderId: z.number(),
//             reason: z.string().default("Refund Accept"),
//         },
//         async (arg) => {
//             const { query, context, orderId, reason } = arg;
//             const data = await acceptRefund(query, context, orderId, reason);
//             console.log(data);
            
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: JSON.stringify(data, null, 2)
//                     }
//                 ]
//             };
//         }
//     );

//     // Add more tools as needed...
// }

export const registerTools = [
    {
      name: "addTwoNumbers",
      description: "Add two numbers",
      schema: {
        a: z.number(),
        b: z.number(),
      },
      handler: async (arg) => addTwoNumbers(arg),
    },
  
    // Uncomment and add more tools if needed
    // {
    //   name: "get_products_ae",
    //   description: "Get all the products from within the shop",
    //   schema: {
    //     query: z.string(),
    //     context: z.string().optional(),
    //   },
    //   handler: async (arg) => getProducts(arg.query),
    // },
  
    {
      name: "get_order_details_ae",
      description: "Get all the order details of the product",
      schema: {
        query: z.string(),
        orderId: z.string(),
        context: z.string().optional(),
      },
      handler: async (arg) => {
        const { query, context, orderId } = arg;
        const data = await getOrderDetails(query, context, orderId);
        console.log("----------------------------------------------------------------- ", data);
  
        const prompt = `
  You are an AI assistant for an ecommerce store. Summarize the following order details for the customer in a clear, friendly, and concise way. 
  Highlight order number, items, quantities, prices, shipping status, and any other important info. 
  Do not include raw JSON or technical details in your summary.
  
  Order details (JSON):
  ${JSON.stringify(data, null, 2)}
  Products inside this image(JSON):
  ${console.log("---------------------------- products ", JSON.stringify(data?.result?.lineItems, null, 2))}
  ${JSON.stringify(data?.result?.lineItems, null, 2)}
        `.trim();
  
        return {
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        };
      },
    },
  
    {
      name: "add_product_ae",
      description: "Add products in the order that is already placed.",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        orderId: z.string(),
        customerId: z.string(),
        productVariantId: z.string(),
        quantity: z.number(),
      },
      handler: async (arg) => {
        const { query, context, orderId, customerId, productVariantId, quantity } = arg;
        const data = await addProduct(query, context, orderId, customerId, productVariantId, quantity);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "remove_product_ae",
      description: "Remove products in the order that is already placed.",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        orderId: z.string(),
        customerId: z.string(),
        productVariantId: z.string(),
        calculatedLineItemId: z.string(),
      },
      handler: async (arg) => {
        const { query, context, orderId, customerId, productVariantId, calculatedLineItemId } = arg;
        const data = await removeProduct(query, context, orderId, customerId, productVariantId, calculatedLineItemId);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "edit_quantity_ae",
      description: "Remove products in the order that is already placed.",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        orderId: z.string(),
        calculatedLineItemId: z.string(),
        quantity: z.number(),
        oldQuantity: z.number(),
        customerId: z.string(),
        productVariantId: z.string(),
      },
      handler: async (arg) => {
        const { query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity } = arg;
        const data = await editQuantity(query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "edit_address_ae",
      description: "Edit the address in the order that is already placed.",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        customerId: z.string(),
        address1: z.string(),
        address2: z.string(),
        orderId: z.string(),
        city: z.string(),
        country: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string(),
        province: z.string(),
        provinceCode: z.string(),
        zip: z.string(),
      },
      handler: async (arg) => {
        const { query, context, orderId, customerId, address1, address2, city, country, firstName, lastName, phone, province, provinceCode, zip } = arg;
        const data = await editAddress(query, context, orderId, customerId, address1, address2, city, country, firstName, lastName, phone, province, provinceCode, zip);
        console.log(data.data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "apply_discount_ae",
      description: "Apply a discount to the order that is already placed.",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        orderId: z.string(),
        discountCode: z.string(),
        isChecking: z.boolean().default(false),
        removeOldDiscount: z.boolean().default(false),
      },
      handler: async (arg) => {
        const { query, context, orderId, customerId, discountCode, isChecking, removeOldDiscount } = arg;
        const data = await applyDiscount(query, context, orderId, customerId, discountCode, isChecking, removeOldDiscount);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "search_shop_catalog",
      description: "Search the shop catalog using remote MCP server",
      schema: {
        query: z.string().optional().default(""),
        context: z.string().optional().default(""),
        storefrontUrl: z.string(),
      },
      handler: async (arg) => {
        const { query, context, storefrontUrl } = arg;
        try {
          const data = {
            jsonrpc: "2.0",
            method: "tools/call",
            id: 1,
            params: {
              name: "search_shop_catalog",
              arguments: {
                query: query ? query : "",
                context: context ? context : "",
              },
            },
          };
          const response = await axios.post(`https://${storefrontUrl}/api/mcp`, data, {
            headers: { "Content-Type": "application/json" },
          });
          const json = await response.data;
  
          if (!json.result || !json.result.content) {
            return {
              content: [
                {
                  type: "text",
                  text: "Remote server returned no content.",
                },
              ],
            };
          }
  
          return {
            content: json.result.content,
          };
        } catch (err) {
          console.error("Error contacting remote MCP server:", err);
          return {
            content: [
              {
                type: "text",
                text: "Failed to contact the remote MCP server.",
              },
            ],
          };
        }
      },
    },
  
    {
      name: "cancel_order_ae",
      description: "Cancel an existing order",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        orderId: z.string(),
        currencyCode: z.string(),
        customerId: z.string(),
        customerRefundedAmount: z.number().min(0).optional(),
        refund: z.boolean().default(false),
        restock: z.boolean().default(false),
        staffNote: z.string().max(500).optional(),
        totalAmount: z.string(),
      },
      handler: async (arg) => {
        const { query, context, orderId, currencyCode, customerId, customerRefundedAmount, refund, restock, staffNote, totalAmount } = arg;
        const data = await cancelOrder(query, context, orderId, currencyCode, customerId, customerRefundedAmount, refund, restock, staffNote, totalAmount);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "orders_list_ae",
      description: "Get List of the orders for the customer",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        customerId: z.string(),
        type: z.string().default("").optional(),
        cursor: z.string().default("").optional(),
      },
      handler: async (arg) => {
        const { query, context, customerId, type, cursor } = arg;
        const data = await orderList(query, context, customerId, type, cursor);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  
    {
      name: "accept_refund_ae",
      description: "Accept the refund for the order",
      schema: {
        query: z.string().optional(),
        context: z.string().optional(),
        orderId: z.number(),
        reason: z.string().default("Refund Accept"),
      },
      handler: async (arg) => {
        const { query, context, orderId, reason } = arg;
        const data = await acceptRefund(query, context, orderId, reason);
        console.log(data);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      },
    },
  ];
  