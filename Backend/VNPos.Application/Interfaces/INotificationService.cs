using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Domain.Entities;

namespace VNPos.Application.Interfaces
{
    public interface INotificationService
    {
        Task SendNewOrderNotification(Order order);
        Task SendProductStockUpdateNotification(int productId, int newQuantity);
    }
}
