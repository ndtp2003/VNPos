using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Application.Common;
using VNPos.Application.DTOs;
using VNPos.Domain.Entities;

namespace VNPos.Application.Interfaces
{
    public interface IProductRepository
    {
        Task<PageResult<Product>> GetProductsAsync(ProductParams productParams);
        Task<bool> UpdateProductStockAsync(int productId, int quantity);
        Task<Product?> GetProductByIdAsync(int productId);
    }
}
