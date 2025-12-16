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
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;
        public OrderRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId)
        {
            return await _context.Orders
                .Where(o => o.OrderId == orderId)
                .Select(o => new OrderResponseDto
                {
                    OrderId = o.OrderId,
                    OrderTime = o.OrderTime,
                    CreatedBy = o.CreatedBy,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    Items = o.OrderDetails.Select(od => new OrderDetailDto
                    {
                        ProductId = od.ProductId,
                        Name = od.Product.Name,
                        Quantity = od.Quantity,
                        UnitPrice = od.UnitPrice
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<PageResult<OrderResponseDto>> GetOrdersAsync(OrderParams orderParams)
        {
            var query = _context.Orders.AsQueryable();
            query = query.OrderByDescending(o => o.OrderTime);
            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((orderParams.PageNumber - 1) * orderParams.PageSize)
                .Take(orderParams.PageSize)
                .Select(o => new OrderResponseDto
                {
                    OrderId = o.OrderId,
                    OrderTime = o.OrderTime,
                    CreatedBy = o.CreatedBy,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    Items = o.OrderDetails.Select(od => new OrderDetailDto
                    {
                        ProductId = od.ProductId,
                        Name = od.Product.Name,
                        Quantity = od.Quantity,
                        UnitPrice = od.UnitPrice
                    }).ToList()
                })
                .ToListAsync();
            return new PageResult<OrderResponseDto>(items, totalCount, orderParams.PageSize, orderParams.PageNumber);
        }
    }
}
