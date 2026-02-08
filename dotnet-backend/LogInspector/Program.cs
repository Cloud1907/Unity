using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace LogInspector
{
    class Program
    {
        static void Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseSqlServer("Server=10.135.140.17\\yazdes;Database=UnityDB;User Id=UNIVERA;Password=P@ssw0rd;TrustServerCertificate=True;");

            using (var db = new AppDbContext(optionsBuilder.Options))
            {
                try {
                    var users = db.Users.ToList();
                    Console.WriteLine($"Successfully fetched {users.Count} users.");
                    foreach(var u in users) {
                        Console.WriteLine($"ID: {u.Id} | Name: {u.FullName} | Username: {u.Username} | Email: {u.Email}");
                    }
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: " + ex.Message);
                    if (ex.InnerException != null) Console.WriteLine("INNER: " + ex.InnerException.Message);
                }
            }
        }
    }
}
