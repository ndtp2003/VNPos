using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Application.Common;
using VNPos.Application.DTOs;
using VNPos.Application.Interfaces;
using VNPos.Domain.Entities;

namespace VNPos.Application.Services
{
    public interface IProductService
    {
        Task<PageResult<Product>> GetProductsAsync(ProductParams productParams);
    }
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        public ProductService(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }
        public async Task<PageResult<Product>> GetProductsAsync(ProductParams productParams)
        {
            var products = await _productRepository.GetProductsAsync(productParams);

            var productDtos = products.Items.Select(p => new Product
            {
                ProductId = p.ProductId,
                Name = p.Name,
                QuantityInStock = p.QuantityInStock,
                Price = p.Price
            }).ToList();

            return new PageResult<Product>(
                productDtos,
                products.TotalCount,
                products.PageSize,
                products.CurrentPage
            );
        }
    }
}
