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
    public interface IOrderService
    {
        Task<Order> CreateOrderAsync(CreateOrderDto request, Guid userId);
        Task<PageResult<OrderResponseDto>> GetOrdersAsync(OrderParams orderParams);
        Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId);
    }
    public interface IUnitOfWork
    {
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }

    public class OrderService : IOrderService
    {
        private readonly INotificationService _notificationService;
        private readonly IOrderRepository _orderRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        public OrderService(
            IOrderRepository orderRepository,
            IProductRepository productRepository,
            INotificationService notificationService,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _notificationService = notificationService;
            _unitOfWork = unitOfWork;
        }

        public async Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId)
        {
            return await _orderRepository.GetOrderByIdAsync(orderId);
        }

        public async Task<PageResult<OrderResponseDto>> GetOrdersAsync(OrderParams orderParams)
        {
            return await _orderRepository.GetOrdersAsync(orderParams);
        }

        public async Task<Order> CreateOrderAsync(CreateOrderDto request, Guid userId)
        {
            // Use transaction to ensure data consistency between order and stock updates
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // Generate sequential order code: HD001, HD002, HD003, etc.
                var nextOrderNumber = await _orderRepository.GetNextOrderNumberAsync();
                var orderCode = $"HD{nextOrderNumber:D3}";

                var order = new Order
                {
                    OrderId = Guid.NewGuid(),
                    OrderCode = orderCode,
                    OrderTime = DateTime.UtcNow,
                    CreatedBy = userId,
                    TotalAmount = request.TotalAmount,
                    Status = "Paid",
                    OrderDetails = new List<OrderDetail>()
                };
                foreach (var item in request.Items)
                {
                    var product = await _productRepository.GetProductByIdAsync(item.ProductId);
                    if (product == null)
                        throw new Exception("Product not found");

                    if (product.QuantityInStock < item.Quantity)
                        throw new Exception($"Insufficient stock for product {product.Name}");

                    var detail = new OrderDetail
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price
                    };

                    order.OrderDetails.Add(detail);
                    await _productRepository.UpdateProductStockAsync(product.ProductId, -item.Quantity);
                }

                var newOrder = await _orderRepository.CreateOrderAsync(order);

                await _unitOfWork.CommitTransactionAsync();

                // Notify all connected clients about new order via SignalR
                await _notificationService.SendNewOrderNotification(newOrder);

                return newOrder;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}
