using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Domain.Entities;

namespace VNPos.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<OrderDetail>()
                .HasKey(od => new { od.OrderId, od.ProductId});

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Order)
                .WithMany(o => o.OrderDetails)
                .HasForeignKey(od => od.OrderId);

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Product)
                .WithMany()
                .HasForeignKey(od => od.ProductId);

            modelBuilder.Entity<Order>()
                .Property(o => o.Status)
                .HasDefaultValue("Pending");
            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderDetail>()
                .Property(od => od.UnitPrice)
                .HasColumnType("decimal(18,2)");

            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var staffId = Guid.Parse("22222222-2222-2222-2222-222222222222");

            var adminUser = new User
            {
                UserId = adminId,
                FullName = "Administrator",
                Username = "admin",
                PasswordHash = "$2a$12$hHllIk.YSLfs/t3fKnvXDeXqBdN.ZEyi1ecZwW6YLBnDj0ik3qR3q", //Password: Admin@123
                Role = "Admin"
            };

            var staffUser = new User
            {
                UserId = staffId,
                FullName = "Staff Member",
                Username = "staff",
                PasswordHash = "$2a$12$bih8ZVbkjDlewki73o5CnecyJAMCp5k0mBVaR3gWwbCt1MkGkLs.K", //Password: Staff@123
                Role = "Staff"
            };
            modelBuilder.Entity<User>().HasData(adminUser, staffUser);

            var products = new List<Product>();
            for (int i = 1; i <= 20; i++)
            {
                products.Add(new Product
                {
                    ProductId = i,
                    Name = $"Product {i}",
                    Price = 10000 * i,
                    QuantityInStock = i * 10 + 5
                });
            }
            modelBuilder.Entity<Product>().HasData(products);
        }
    }
}
