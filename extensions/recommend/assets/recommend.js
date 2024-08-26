

document.addEventListener("DOMContentLoaded", async function () {
    const productsId = document.getElementById("productsId");
    const c = document.getElementById('currency');
    const symbol = c.value;
    const u = document.getElementById("lb-shop-url")
    const url = u.value;


    if (productsId) {
        const cartItems = await getCart(url);

        if (cartItems && cartItems.length > 0) {
            productsId.innerHTML = `
                    <div id="carouselExampleControls" class="carousel slide carousel-fade" data-ride="carousel">
                        <div class="carousel-inner">
                            ${cartItems.map((item, index) => {
                const imageSrc = item.image?.src || 'default-image.jpg';
                const description = item.body_html || '';
                const price = item.variants && item.variants.length > 0 ? item.variants[0].price : 'Price not available';
                const activeClass = index === 0 ? 'active' : '';
                return `
                                    <div class="carousel-item ${activeClass}">
                                    <div class="product-card">
                                    <img src="${imageSrc}" alt="${item.title}" class="product-image" />
                                    <h2 class="product-title">${item.title}</h2>
                                    <p class="product-description">${description}</p>
                                    <p class="product-price" id="product-price-${index}">${symbol.slice(0, 1)}${price}</p>
                                    ${item.variants.filter(variant => {
                    return variant.inventory_policy === "continue" || variant.inventory_quantity > 0;
                }).length > 1 ? `
                                        <select class="variant-select" data-price-element="product-price-${index}">
                                        ${item.variants.filter(variant => {
                    return variant.inventory_policy === "continue" || variant.inventory_quantity > 0;
                }).map(variant => {
                    return `<option value="${variant.id}" data-price="${variant.price}">${variant.title}</option>`;
                }).join('')}
                                                </select>
                                                ` : `
                                                <span>Variant : ${item.variants[0].title}</span>
                                                `}
                                                <div class="quantity-container">
                                                <button id='lb-quantity-button' class="lb-decrement" data-index="${index}">-</button>
                                                <input class="lb-quantity" id="quantity-${index}" value="1" readonly="readonly"/>
                                                <button id='lb-quantity-button' class="lb-increment" data-index="${index}">+</button>
                                                </div>
                                            <div class='buttons'>
                                            <button class="view-button" data-handle="${item.handle}">View</button>
                                            <button class="add-to-cart-button" data-product-id="${item.variants[0].id}" data-index="${index}">Add to Cart</button>
                                            </div>
                                            </div>
                                            </div>
                                            `;
            }).join('')}
                        </div>
                            <div>
                            <a id="carousel-prev" class="carousel-control-prev" href="#carouselExampleControls" role="button" data-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span class="sr-only">Previous</span>
                            </a>
                        <a id="carousel-next" class="carousel-control-next" href="#carouselExampleControls" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                        </a>
                        </div>
                        `;
            var id = '';
            const viewButtons = document.querySelectorAll('.view-button');
            viewButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const handle = this.getAttribute('data-handle');
                    window.location.href = `/products/${handle}`;
                });
            });

            if (cartItems.length <= 1) {
                document.getElementById('carousel-prev').style.display = 'none';
                document.getElementById('carousel-next').style.display = 'none';
            }


            document.querySelectorAll('.variant-select').forEach(selectElement => {
                selectElement.addEventListener('change', function () {
                    const selectedOption = this.options[this.selectedIndex];
                    const selectedPrice = selectedOption.getAttribute('data-price');
                    const priceElementId = this.getAttribute('data-price-element');
                    const priceElement = document.getElementById(priceElementId);
                    id = this.value;
                    if (priceElement) {
                        priceElement.innerHTML = `${symbol.slice(0, 1)}${selectedPrice}`;
                    }
                });
            });

            document.querySelectorAll('.quantity-container').forEach(container => {
                const index = container.querySelector('.lb-increment').getAttribute('data-index');
                const quantityInput = document.getElementById(`quantity-${index}`);
                const incrementButton = container.querySelector('.lb-increment');
                const decrementButton = container.querySelector('.lb-decrement');

                incrementButton.addEventListener('click', function () {
                    let currentValue = parseInt(quantityInput.value, 10);
                    quantityInput.value = currentValue + 1;
                });

                decrementButton.addEventListener('click', function () {
                    let currentValue = parseInt(quantityInput.value, 10);
                    if (currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                    }
                });
            });

            document.querySelectorAll('.add-to-cart-button').forEach(button => {
                button.addEventListener('click', function () {

                    const productId = id == '' ? this.getAttribute('data-product-id') : id;
                    const index = this.getAttribute('data-index');
                    const quantity = document.getElementById(`quantity-${index}`).value;
                    addCartLines(productId, quantity);
                });
            });
        } else {
            productsId.innerHTML = "";
        }
    }
});


async function getCartId() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        return cart.token; 
    } catch (error) {
        console.error('Failed to fetch cart ID:', error);
        return null; 
    }
}

// async function addToCart(id, quantity) {

//     let formData = {
//         'items': [{
//             'id': Number(id),
//             'quantity': Number(quantity)
//         }]
//     };

//     try {
//         const response = await fetch("/cart/add.js", {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token': ""
//             },
//             body: JSON.stringify(formData)
//         });
//         const result = await response.json();

//         if (response.ok) {
//             window.location.reload();
//             return result;
//         }
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

async function getCart(url) {
    try {
        const response = await fetch(`${url}cart.js`);


        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cartData = await response.json();
        const cartItems = cartData.items;
        console.log("Inside get cart", cartItems)


        const dbEntries = await getProducts(url);
        console.log("dbentries", dbEntries);
        let recommendedProductIds = new Set();
        let topOffer = null;
        let highestPriority = Number.MAX_VALUE;

       
        for (const cartItem of cartItems) {
            for (const dbEntry of dbEntries) {
                let triggerProductIds = dbEntry.triggerProductIds?.L?.map(item => item.S) || [];
                let recommendedProductIds = dbEntry.recommendedProductIds?.L?.map(item => item.S) || [];
                
                if (dbEntry.isEnabled.S == "true" || dbEntry.isEnabled.BOOL) {
                    if ((dbEntry?.isAll.S=="true" || dbEntry?.isAll.BOOL) || triggerProductIds.includes(`gid://shopify/Product/${cartItem.product_id}`)) {
                        const filteredRecommendedProducts = recommendedProductIds.filter(
                            recommendedProductId => !cartItems.some(cartItem => `gid://shopify/Product/${cartItem.product_id}` === recommendedProductId)
                        );
        
                        if (filteredRecommendedProducts.length > 0) {
                            const priority = Number(dbEntry.priority.N);
                            if (priority < highestPriority) {
                                highestPriority = priority;
                                dbEntry.recommendedProductIds.L = filteredRecommendedProducts.map(item => ({ S: item }));
                                topOffer = dbEntry;
                            }
                        }
                    }
                }
            }
        }

        if (topOffer && topOffer.recommendedProductIds?.L) {
            topOffer.recommendedProductIds.L.forEach(item => recommendedProductIds.add(item.S));
        }

        const productRecommendations = await Promise.all(
            Array.from(recommendedProductIds).map(async productId => {
                return await fetchProductById(productId, url);
            })
        );

        const filteredProductRecommendations = productRecommendations.filter(product => product !== null);


        return filteredProductRecommendations;
    } catch (err) {
        console.error("Error fetching cart data:", err);
        return [];
    }
}

const fetchProductById = async (productUrl, url) => {
    const productId = productUrl.split('/').pop();
    console.log(productId);
    const response = await fetch(`${url}admin/api/2023-04/products/${productId}.json`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': ""
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();

    const product = data.product;


    const hasValidVariant = product.variants.some(variant =>
        variant.inventory_policy === "continue" || variant.inventory_quantity > 0
    );

    if (hasValidVariant) {
        return product;
    } else {
        return null;
    }
};

async function getProducts(url) {

    try {
        const response = await fetch(`http://localhost:3004/recommendations?shop=${url}`);
        const offers = await response.json();

        return offers;
    } catch (err) {
        console.error("Error fetching products:", err);
        return [];
    }
}

async function addCartLines(variantId, quantity) {
    const i = await getCartId();
    const variables = {
        cartId: `gid://shopify/Cart/${i}`,
        lines: {
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
            quantity: Number(quantity)
        }
    }
    const query = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            lines(first: 5) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    try {
        const response = await fetch('https://arwin-lb.myshopify.com/api/2024-07/graphql.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': '',
            },
            body: JSON.stringify({ query, variables: variables })
        });

        const responseBody = await response.json();
        console.log("response body", responseBody);

        if (responseBody.errors) {
            console.error('GraphQL errors:', responseBody.errors);
        } else {
            window.location.reload();
            return responseBody.data.cartLinesAdd;
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}
