using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Application.Interfaces;
using VNPos.Domain.Entities;
using VNPos.Infrastructure.Hubs;

namespace VNPos.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<OrderHub> _hubContext;
        public NotificationService(IHubContext<OrderHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendNewOrderNotification(Order order)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveNewOrder", new
            {
                OrderId = order.OrderId,
                OrderTime = order.OrderTime,
                TotalAmount = order.TotalAmount,
                CreatedBy = order.CreatedBy,
                Status = order.Status
            });
        }
    }

}
