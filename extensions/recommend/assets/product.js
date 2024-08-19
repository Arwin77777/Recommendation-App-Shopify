document.addEventListener("DOMContentLoaded", async function () {
    const productsId = document.getElementById("productsId");
    const c = document.getElementById('currency');
    const symbol = c.value;

    if (productsId) {
        const cartItems = await getCart();
        console.log("Recommended items:", cartItems);
        if (cartItems && cartItems.length > 0) {
            productsId.innerHTML = `
                <div id="carouselExampleControls" class="carousel slide carousel-fade" data-ride="carousel">
                    <div class="carousel-inner">
                        ${cartItems.map((item, index) => {
                            const imageSrc = item.image?.src || 'default-image.jpg';
                            const description = item.body_html || '';
                            const price = item.variants && item.variants.length > 0 ? item.variants[0].price : 'Price not available';

                            // Add "active" class to the first carousel item
                            const activeClass = index === 0 ? 'active' : '';
                            return `
                                <div class="carousel-item ${activeClass}">
                                    <div class="product-card">
                                        <img src="${imageSrc}" alt="${item.title}" class="product-image" />
                                        <h2 class="product-title">${item.title}</h2>
                                        <p class="product-description">${description}</p>
                                        <p class="product-price">${symbol.slice(0, 1)}${price}</p>
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
                                            <button class="decreament">-</button>
                                            <input class="quantity" id="product-quantity" value="1" readonly="readonly"/>
                                            <button class="increament">+</button>
                                        </div>
                                        <div class='buttons'>
                                            <button class="view-button" data-handle="${item.handle}">View</button>
                                            <button class="add-to-cart-button" data-product-id="${item.variants[0].id}">Add to Cart</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <a class="carousel-control-prev" href="#carouselExampleControls" role="button" data-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#carouselExampleControls" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>
                </div>
            `;

            const viewButtons = document.querySelectorAll('.view-button');
            viewButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const handle = this.getAttribute('data-handle');
                    window.location.href = `/products/${handle}`;
                });
            });

            let id = '';
            document.querySelectorAll('.variant-select').forEach(selectElement => {
                selectElement.addEventListener('change', async function () {
                    const selectedVariantId = this.value;
                    const priceElementId = this.getAttribute('data-price-element');
                    const selectedOption = this.options[this.selectedIndex];
                    const selectedPrice = selectedOption.getAttribute('data-price');
                    
                    console.log('Selected variant ID:', selectedVariantId);
                    // const price = document.querySelector('.product-price').value;
                    const price = await findPrice(selectedVariantId);
                    console.log(price);
                    price.innerHTML = `${symbol.slice(0, 1)}${"10"}`;
                    id = selectedVariantId;
                    // const priceElement = document.querySelector(`.${priceElementId}`);
                    // priceElement.textContent = `${symbol.slice(0, 1)}${selectedPrice}`;
                });
            });

            const quantityInput = document.getElementById("product-quantity");
            const incrementButton = document.querySelector('.increament');
            const decrementButton = document.querySelector('.decreament');

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

            async function findPrice(id){
                console.log(id);
                const details = await fetch(`/admin/api/2023-10/variants/${id}.json`,{
                    method:'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token':""
                    }
                });
                console.log("this is the variant details",details.variant.price);
                if(details.ok)
                {
                    console.log("this is the details",details);
                    return details.variant.price;
                }
                else
                    return details;
            }

            document.querySelectorAll('.add-to-cart-button').forEach(button => {
                button.addEventListener('click', function () {
                    const productId = this.getAttribute('data-product-id');
                    const quantity = document.getElementById("product-quantity").value;
                    addToCart(id ? id : productId, quantity);
                });
            });
        } else {
            productsId.innerHTML = "No offers applicable.";
        }
    }
});


// Function to add a product to the cart
async function addToCart(id, quantity) {
    console.log("Adding to cart:", quantity,"id",id);
    let formData = {
        'items': [{
            'id': Number(id),
            'quantity': Number(quantity)
        }]
    };
    console.log("Form Data:", formData);
    try {
        const response = await fetch("/cart/add.js", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token':""
            },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        console.log("Response:", result);
        if (response.ok) {
            console.log("Successfully added to cart:", result);
            window.location.reload();
            return result;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to get cart items
async function getCart() {
    try {
        const response = await fetch("https://arwin-lb.myshopify.com/cart.js");
        console.log("Full Response:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cartData = await response.json();
        const cartItems = cartData.items;
        console.log("Cart Items:", cartItems);

        const dbEntries = await getProducts();
        let recommendedProductIds = new Set();

        for (const cartItem of cartItems) {
            let topOffer = null;
            let highestPriority = Number.MAX_VALUE;

            for (const dbEntry of dbEntries) {
                let triggerProductIds = dbEntry.triggerProductIds?.L?.map(item => item.S) || [];

                if (triggerProductIds.includes(`gid://shopify/Product/${cartItem.product_id}`)) {
                    if (dbEntry.isEnabled === "true" || dbEntry.isEnabled) {
                        const priority = Number(dbEntry.priority.N);
                        if (priority < highestPriority) {
                            highestPriority = priority;
                            topOffer = dbEntry;
                        }
                    }
                }
            }

            if (topOffer && topOffer.recommendedProductIds?.L) {
                topOffer.recommendedProductIds.L.forEach(item => recommendedProductIds.add(item.S));
            }
        }

        const productRecommendations = await Promise.all(
            Array.from(recommendedProductIds).map(async productId => {
                return await fetchProductById(productId);
            })
        );

        // Filter out null values from the recommendations
        const filteredProductRecommendations = productRecommendations.filter(product => product !== null);

        console.log("Filtered Product Recommendations:", filteredProductRecommendations);
        return filteredProductRecommendations;
    } catch (err) {
        console.error("Error fetching cart data:", err);
        return [];
    }
}

// Function to fetch product by ID
const fetchProductById = async (productUrl) => {
    const productId = productUrl.split('/').pop();
    const response = await fetch(`https://arwin-lb.myshopify.com/admin/api/2023-04/products/${productId}.json`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token':""
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("shop data",data.shop);
    const product = data.product;
    console.log("Product fetched by ID:", product);

    // Check if the product has valid variants
    const hasValidVariant = product.variants.some(variant =>
        variant.inventory_policy === "continue" || variant.inventory_quantity > 0
    );

    if (hasValidVariant) {
        return product; // Return the whole product if it has valid variants
    } else {
        return null; // Return null if no valid variants are found
    }
};

// Function to get products from the local server (DynamoDB)
async function getProducts() {
    console.log("Fetching offers...");
    try {
        const response = await fetch('http://localhost:3004/offers');
        const offers = await response.json();
        console.log("DynamoDB products:", offers);
        return offers;
    } catch (err) {
        console.error("Error fetching products:", err);
        return [];
    }
}
