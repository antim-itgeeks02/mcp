import axios from "axios"

const staticApiKey = "ae_aca4b3757c735ef5402a94994c9ef999dab7ad212018aebebce7b7ca88719dbb"
const shop = "shop-chat-agent-674.myshopify.com"
const lang = "en"
const extension = "IndividualEditOrderItems"


export async function getOrderDetails(query, context, orderId) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const response = await axios.get(`https://account-editor-stage.fly.dev/api/extension/order/details?orderId=${orderId}&extensionName=${extension}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,{
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(response);
        
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function addProduct(query, context, orderId, customerId, productVariantId, quantity) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const data = [
            {
                productVariantId,
                quantity,
                customerId,
                selectedMethod: null
            }
        ];
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/edit/add-item?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function removeProduct(query, context, orderId, customerId, productVariantId, calculatedLineItemId) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const data = {
            calculatedLineItemId,
            customerId,
            productVariantId,
            selectedMethod: null
          }
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/edit/remove-item?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function editQuantity(query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const data = [{
            calculatedLineItemId,
            quantity,
            oldQuantity,
            customerId,
            productVariantId,
            selectedMethod: null
          }]
          
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/edit/edit-item?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function editAddress(query, context, orderId, customerId, address1, address2, city, country, firstName, lastName, phone, province, provinceCode, zip) {

    const shippingLines = [{
        id: "gid://shopify/ShippingLine/5099757797542",
        originalPriceSet: {
            presentmentMoney: {
                amount: "0.0",
                currencyCode: "USD"
            }
        },
        presentmentMoney: {
            amount: "0.0",
            currencyCode: "USD"
        },
        amount: "0.0",
        title: "Economy"
    }];

    try {
        const data = {
            address1,
            address2,
            city,
            country,
            customerId,    // gid id
            firstName,
            lastName,
            phone,
            province,
            provinceCode,
            selectedMethod: null,
            zip,
        }

        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/address/check-shipping-address?orderId=${orderId}&language=${lang}&extensionName=${extensionDelivery}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(response.data);

         if (response?.data?.result && response?.data?.result.length > 0) {
          const defaultSelectedMethods = {};
          response.data.result.forEach((group) => {
            const profileId = group.deliveryProfileId;
            if (group.shippingOptions.length > 0) {
              let matchedIndex = 0; // default to 0 if no match found
              if (shippingLines.length > 0) {
                group.shippingOptions.forEach((option, index) => {
                  const optionTitle = option.name;
                  const optionPrice = parseFloat(option.price).toFixed(2); // Normalize to 2 decimal places
                  const matched = shippingLines.some((shippingLine) => {
                    const shippingTitle = shippingLine?.title;
                    const shippingPrice = parseFloat(
                      shippingLine?.originalPriceSet?.presentmentMoney?.amount
                    ).toFixed(2); // Normalize
                    return (
                      shippingTitle === optionTitle && shippingPrice === optionPrice
                    );
                  });
                  if (matched && matchedIndex === 0) {
                    matchedIndex = index;
                  }
                });
              }
              const selectedOption = group.shippingOptions[matchedIndex];
              const value = `${profileId}__${matchedIndex}_<end>_${selectedOption.name}/${selectedOption.price}`;
              defaultSelectedMethods[profileId] = value;
            }
          });
        //   console.log(defaultSelectedMethods);
          data.selectedMethod = defaultSelectedMethods;
          const response2 = await axios.post(`https://account-editor-stage.fly.dev/api/extension/address/check-shipping-address?orderId=${orderId}&language=${lang}&extensionName=${extensionDelivery}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
          return response2.data;
        }
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function applyDiscount(query, context, orderId, discountCode, isChecking, removeOldDiscount) {
    try {
        const data = {
            discountCode,
            // discountCode: "20shipping",
            isChecking,
            removeOldDiscount
        }

        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/discount/apply-discount?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function productList(query, context, orderId, discountCode, isChecking, removeOldDiscount) {
    try {
        const data = {
            discountCode,
            // discountCode: "20shipping",
            isChecking,
            removeOldDiscount
        }

        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/discount/apply-discount?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function cancelOrder(query, context, orderId, currencyCode, customerId, customerRefundedAmount, refund, restock, staffNote, totalAmount) {
    try {
        const data = {
            // currencyCode: "USD",
            currencyCode,
            customerId,
            // customerId: "gid://shopify/Customer/8811884937382",
            customerRefundedAmount,
            // customerRefundedAmount: 154.08,
            // refund: true,
            refund,
            restock,
            // restock: false,
            staffNote,
            // staffNote: "Shipping cost too high",
            // totalAmount: "154.08"
            totalAmount

        }

        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/cancellation/cancel?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function orderList(query, context, customerId, type, cursor) {
    try {
        const data = {
            customerId,
            // customerId: "gid://shopify/Customer/8811884937382",
            type,
            cursor
        }

        const response = await axios.get(`https://customer-account-builder.fly.dev/api/extension/fullpage/order-lists?language=${lang}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function acceptRefund(query, context, orderId, reason) {
    try {
        console.log(orderId, reason);
        
        const data = {
            reason
        }
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/refund/accept?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}



// getOrderDetails("6070613082181")