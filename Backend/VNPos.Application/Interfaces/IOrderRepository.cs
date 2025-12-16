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
    public interface IOrderRepository
    {
        Task<Order> CreateOrderAsync(Order order);
        Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId);
        Task<PageResult<OrderResponseDto>> GetOrdersAsync(OrderParams orderParams);
    }
}
