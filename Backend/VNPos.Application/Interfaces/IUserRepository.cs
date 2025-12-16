using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNPos.Domain.Entities;

namespace VNPos.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?>GetByUsernameAsync(string username);
    }
}
