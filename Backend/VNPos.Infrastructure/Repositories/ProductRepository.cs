using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Application.Common;
using VNPos.Application.DTOs;
using VNPos.Application.Interfaces;
using VNPos.Domain.Entities;
using VNPos.Infrastructure.Data;

namespace VNPos.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly AppDbContext _context;
        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Product?> GetProductByIdAsync(int productId)
        {
            return await _context.Products.FindAsync(productId);
        }

        public async Task<PageResult<Product>> GetProductsAsync(ProductParams productParams)
        {
            var query = _context.Products.AsQueryable();

            if(!string.IsNullOrEmpty(productParams.SearchTerm))
            {
                var searchTerm = productParams.SearchTerm.ToLower();
                query = query.Where(p => p.Name.Contains(searchTerm));
            }

            query = query.OrderBy(p => p.ProductId);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((productParams.PageNumber - 1) * productParams.PageSize)
                .Take(productParams.PageSize)
                .ToListAsync();

            return new PageResult<Product>(items, totalCount, productParams.PageSize, productParams.PageNumber);
        }

        public async Task<bool> UpdateProductStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                return false;
            if (product.QuantityInStock + quantity < 0)
            {
                return false;
            }
            product.QuantityInStock += quantity;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
