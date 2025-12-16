using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VNPos.Domain.Entities
{
    public class Order
    {
        public Guid OrderId { get; set; }
        public DateTime OrderTime { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public Guid CreatedBy { get; set; }
        public string Status { get; set; } = "Pending";
        public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }
}
